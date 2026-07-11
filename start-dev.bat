@echo off
cd /d "%~dp0"
echo.
echo  Proimagem.pt - servidor local
echo  PowerShell: .\start-dev.bat
echo  CMD:        start-dev.bat
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-dev.ps1"
pause