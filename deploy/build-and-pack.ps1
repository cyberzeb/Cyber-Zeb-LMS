# Run on your Windows PC.
# Builds the app, packs ONE zip file (not thousands of files).
#
# Usage:
#   deploy\build-and-pack.cmd              (pack only - upload zip with WinSCP/FileZilla)
#   deploy\build-and-upload.cmd user IP 8085   (pack + upload one zip via scp)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$staging = Join-Path $Root "deploy\.release-staging"
$zipPath = Join-Path $Root "deploy\berana-release.zip"

Write-Host "=== Build frontend ===" -ForegroundColor Yellow
$env:VITE_API_BASE_URL = "/api/v1"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Pack release (one zip file) ===" -ForegroundColor Yellow

if (Test-Path $staging) {
    Remove-Item $staging -Recurse -Force
}
New-Item -ItemType Directory -Path $staging | Out-Null

Copy-Item -Path "$Root\dist" -Destination "$staging\dist" -Recurse
Copy-Item -Path "$Root\deploy" -Destination "$staging\deploy" -Recurse
Copy-Item -Path "$Root\package.json" -Destination "$staging\package.json"

$backendDest = Join-Path $staging "backend"
New-Item -ItemType Directory -Path $backendDest | Out-Null

$excludeDirs = @(".venv", "__pycache__", "tests", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".git")
$excludeFiles = @("*.db", "*.pyc", "*.pyo", ".env")

robocopy "$Root\backend" $backendDest /E /NFL /NDL /NJH /NJS /nc /ns /np `
    /XD $excludeDirs `
    /XF $excludeFiles | Out-Null

# robocopy exit codes 0-7 are success
if ($LASTEXITCODE -gt 7) {
    Write-Host "Failed to copy backend files." -ForegroundColor Red
    exit 1
}

# Drop pack script artifacts from the bundle
Remove-Item "$staging\deploy\.release-staging" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$staging\deploy\berana-release.zip" -Force -ErrorAction SilentlyContinue

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}
Compress-Archive -Path "$staging\*" -DestinationPath $zipPath -Force

$sizeMb = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "Created: $zipPath ($sizeMb MB)" -ForegroundColor Green
Write-Host ""
Write-Host "Upload options:" -ForegroundColor Cyan
Write-Host "  A) deploy\build-and-upload.cmd USER IP 8085   (one scp upload)"
Write-Host "  B) WinSCP / FileZilla: upload deploy\berana-release.zip to the VPS home folder"
Write-Host "     Then on VPS: mkdir -p ~/Cyber-Zeb-LMS && unzip -o ~/berana-release.zip -d ~/Cyber-Zeb-LMS"
