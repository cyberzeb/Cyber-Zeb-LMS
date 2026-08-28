@echo off
REM Double-click or run from cmd — avoids Windows opening .ps1 in Notepad.
REM Usage: deploy\build-and-upload.cmd YOUR_SSH_USER YOUR_VPS_IP [PORT]
REM Example: deploy\build-and-upload.cmd root 203.0.113.10 8085

setlocal
cd /d "%~dp0\.."

if "%~1"=="" (
  echo Usage: deploy\build-and-upload.cmd SSH_USER VPS_IP [PORT]
  echo Example: deploy\build-and-upload.cmd root 203.0.113.10 8085
  exit /b 1
)
if "%~2"=="" (
  echo Error: VPS IP required.
  echo Usage: deploy\build-and-upload.cmd SSH_USER VPS_IP [PORT]
  exit /b 1
)

set "PORT=8085"
if not "%~3"=="" set "PORT=%~3"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-and-upload.ps1" -VpsUser "%~1" -VpsHost "%~2" -Port %PORT%
exit /b %ERRORLEVEL%
