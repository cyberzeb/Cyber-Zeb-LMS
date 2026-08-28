# Run on your Windows PC - builds and packs ONE zip file (no upload).
# Upload deploy\berana-release.zip with WinSCP, FileZilla, or build-and-upload.cmd

@echo off
cd /d "%~dp0\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-and-pack.ps1"
exit /b %ERRORLEVEL%
