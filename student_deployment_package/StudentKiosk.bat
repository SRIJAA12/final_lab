@echo off
REM Wait 10 seconds for Windows to fully load
timeout /t 10 /nobreak >nul

REM Start the kiosk
cd /d C:\StudentKiosk
start "" npm start
