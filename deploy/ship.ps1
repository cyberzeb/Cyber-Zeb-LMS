# Commit, push, then pull and redeploy on the VPS - one command.
#
#   deploy\ship.cmd                          # asks for a commit message if needed
#   deploy\ship.cmd -Message "Fix login"     # commit with this message
#   deploy\ship.cmd -NoDeploy                # only commit + push
#   deploy\ship.cmd -DeployOnly              # server only: pull + redeploy
#   deploy\ship.cmd -Branch main             # deploy another branch
#
# Server details live in deploy\ship.config.json (not committed). The first run
# asks for them and saves the file.
#
# On the server it runs deploy/vps-docker.sh, which keeps the existing .env and
# database volume, rebuilds the containers and health-checks them.

param(
    [string]$Message = "",
    [string]$Branch = "",
    [switch]$NoDeploy,
    [switch]$DeployOnly,
    [switch]$Yes
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
$ConfigPath = Join-Path $Root "deploy\ship.config.json"

function Step($text) { Write-Host ""; Write-Host "=== $text ===" -ForegroundColor Yellow }
function Fail($text) { Write-Host $text -ForegroundColor Red; exit 1 }
function Run-Git {
    & git @args
    if ($LASTEXITCODE -ne 0) { Fail "git $($args -join ' ') failed." }
}

# -- Config --------------------------------------------------------------------
function Read-Required($prompt) {
    do { $value = (Read-Host $prompt).Trim() } while (-not $value)
    return $value
}

function Read-WithDefault($prompt, $default) {
    $value = Read-Host "$prompt [$default]"
    if ([string]::IsNullOrWhiteSpace($value)) { return $default }
    return $value.Trim()
}

if (-not (Test-Path $ConfigPath)) {
    if ($DeployOnly -or -not $NoDeploy) {
        Step "First run: server details (saved to deploy\ship.config.json)"
        $vpsHost = Read-Required "VPS IP or hostname"
        $cfg = [ordered]@{
            host       = $vpsHost
            user       = Read-Required "SSH user name (the Linux login, e.g. root - NOT the password)"
            port       = [int](Read-WithDefault "SSH port" "22")
            sshKey     = Read-WithDefault "SSH key file (blank = default)" "$env:USERPROFILE\.ssh\id_ed25519"
            remoteDir  = Read-WithDefault "Project folder on the VPS" "/home/lms/Cyber-Zeb-LMS"
            deployArgs = Read-WithDefault "Arguments for deploy/vps-docker.sh" "--ip $vpsHost"
            useSudo    = ((Read-WithDefault "Run the deploy script with sudo? (y/n)" "n") -match '^[yY]')
        }
        $cfg | ConvertTo-Json | Out-File -FilePath $ConfigPath -Encoding utf8
        Write-Host "Saved to $ConfigPath (edit it to change these later):" -ForegroundColor Green
        Get-Content $ConfigPath | Write-Host
    }
}
$config = $null
if (Test-Path $ConfigPath) {
    $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    if ((-not $NoDeploy -or $DeployOnly) -and [string]::IsNullOrWhiteSpace($config.user)) {
        $config.user = Read-Required "SSH user name (the Linux login, e.g. root - NOT the password)"
        $config | ConvertTo-Json | Out-File -FilePath $ConfigPath -Encoding utf8
    }
}

# -- Branch --------------------------------------------------------------------
$current = (& git rev-parse --abbrev-ref HEAD).Trim()
if (-not $Branch) { $Branch = $current }
if ($Branch -notmatch '^[A-Za-z0-9._/-]+$') { Fail "Unsupported branch name: $Branch" }

# -- Commit + push -------------------------------------------------------------
if (-not $DeployOnly) {
    if ($Branch -ne $current) {
        Fail "You are on '$current' but asked to push '$Branch'. Check out '$Branch' first, or use -DeployOnly."
    }

    Step "Local changes on $Branch"
    $changes = & git status --porcelain
    if ($changes) {
        & git status --short
        if (-not $Message) { $Message = Read-Host "Commit message" }
        if ([string]::IsNullOrWhiteSpace($Message)) { Fail "A commit message is required." }
        if (-not $Yes) {
            $ok = Read-Host "Commit ALL files listed above? (y/n)"
            if ($ok -notmatch '^[yY]') { Fail "Stopped. Nothing was committed." }
        }
        Run-Git add -A
        Run-Git commit -m $Message
    } else {
        Write-Host "Nothing to commit."
    }

    Step "Pull latest $Branch (rebase) and push"
    $remoteHead = & git ls-remote --heads origin $Branch
    if ($LASTEXITCODE -ne 0) { Fail "Cannot reach origin. Check your connection or GitHub login." }
    if ($remoteHead) {
        # Someone else may have pushed; replay our commits on top instead of failing.
        Run-Git pull --rebase origin $Branch
        Run-Git push origin $Branch
    } else {
        Run-Git push -u origin $Branch
    }
    Write-Host "Pushed $Branch." -ForegroundColor Green
}

if ($NoDeploy) {
    Write-Host ""
    Write-Host "Done (deploy skipped)." -ForegroundColor Green
    exit 0
}
if (-not $config) { Fail "No server config. Run once without -NoDeploy to create deploy\ship.config.json." }

# -- Pull + redeploy on the server ---------------------------------------------
$sshArgs = @("-o", "ConnectTimeout=15", "-p", "$($config.port)")
if ($config.sshKey -and (Test-Path -LiteralPath $config.sshKey)) { $sshArgs += @("-i", $config.sshKey) }
$target = "$($config.user)@$($config.host)"

$deployCmd = "bash deploy/vps-docker.sh $($config.deployArgs)"
if ($config.useSudo) { $deployCmd = "sudo $deployCmd" }

# Refuses to deploy if someone edited tracked files on the server, rather than
# silently overwriting them. The .env and database are untracked, so they are safe.
$remote = @"
set -e
cd '$($config.remoteDir)'
if [ -n "`$(git status --porcelain --untracked-files=no)" ]; then
  echo 'The server copy has uncommitted changes to tracked files:'
  git status --short --untracked-files=no
  echo 'Commit or discard them on the server, then run ship again.'
  exit 3
fi
echo '--- git: fetching $Branch'
git fetch origin '$Branch'
git checkout '$Branch'
git pull --ff-only origin '$Branch'
echo "--- now at: `$(git log -1 --oneline)"
echo '--- redeploying'
$deployCmd
"@ -replace "`r", ""

Step "Deploy $Branch to $target"
# Sent base64-encoded so no quoting survives the trip through Windows argv.
# -t so sudo can ask for a password (it reads the terminal, not the pipe).
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remote))
& ssh @sshArgs -t $target "echo $encoded | base64 -d | bash"
$code = $LASTEXITCODE
if ($code -eq 3) { Fail "Deploy stopped: the server has local changes (see above)." }
if ($code -ne 0) { Fail "Deploy failed (exit $code). See the output above." }

Write-Host ""
Write-Host "Deployed $Branch to $($config.host)." -ForegroundColor Green
