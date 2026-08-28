# Builds, packs ONE zip, uploads it once, unpacks on the VPS.
#
# Usage:
#   deploy\build-and-upload.cmd myuser 203.0.113.10 8085
#   powershell -ExecutionPolicy Bypass -File .\deploy\build-and-upload.ps1 -VpsUser myuser -VpsHost 203.0.113.10 -Port 8085 -SshKey "$env:USERPROFILE\.ssh\id_rsa"

param(
    [Parameter(Mandatory = $true)]
    [string]$VpsUser,

    [Parameter(Mandatory = $true)]
    [string]$VpsHost,

    [int]$Port = 8085,

    [string]$RemoteDir = "~/Cyber-Zeb-LMS",

    [string]$SshKey = "",

    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$zipPath = Join-Path $Root "deploy\berana-release.zip"
$remoteZip = "~/berana-release.zip"

function Get-SshBaseArgs {
    $args = @()
    if ($SshKey -and (Test-Path -LiteralPath $SshKey)) {
        $args += "-i", $SshKey
    }
    return $args
}

$sshBase = Get-SshBaseArgs
$target = "${VpsUser}@${VpsHost}"

Write-Host ""
Write-Host "=== Step 1: Pack release ===" -ForegroundColor Yellow

if (-not $SkipBuild -or -not (Test-Path $zipPath)) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "deploy\build-and-pack.ps1")
    if ($LASTEXITCODE -ne 0) { exit 1 }
} else {
    Write-Host "Using existing $zipPath"
}

$sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "Zip size: $sizeMb MB (one file upload)" -ForegroundColor Green

Write-Host ""
Write-Host "=== Step 2: SSH login ===" -ForegroundColor Yellow
Write-Host "Target: $target"
if (-not $SshKey) {
    Write-Host "Password prompt: nothing shows while typing - that is normal."
}

& ssh @sshBase -o ConnectTimeout=15 $target "echo SSH_OK"
if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH failed. Fix login first: ssh $target" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Step 3: Upload ONE zip file ===" -ForegroundColor Yellow
& scp @sshBase $zipPath "${target}:${remoteZip}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Step 4: Unpack on VPS ===" -ForegroundColor Yellow
$unpackCmd = "mkdir -p $RemoteDir && unzip -o $remoteZip -d $RemoteDir && rm -f $remoteZip"
& ssh @sshBase $target $unpackCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "Unzip failed. On the VPS run: sudo apt install unzip" -ForegroundColor Red
    exit 1
}

$demoUrl = "http://${VpsHost}:${Port}"

Write-Host ""
Write-Host "Done. On the VPS run:" -ForegroundColor Green
Write-Host "  ssh $target"
Write-Host "  cd $RemoteDir"
Write-Host "  chmod +x deploy/*.sh"
Write-Host "  ./deploy/install-vps.sh"
Write-Host "  # edit backend/.env - JWT_SECRET_KEY and CORS_ORIGINS=$demoUrl"
Write-Host "  BRANA_PORT=$Port ./deploy/start.sh"
Write-Host ""
Write-Host "Stakeholders open: $demoUrl" -ForegroundColor Green
