@echo off
REM ================================================================
REM KIOSK LAUNCHER - HIDES CMD WINDOW COMPLETELY
REM ================================================================
REM This batch file launches the kiosk and then hides itself
REM so Windows gives full control to the kiosk application
REM ================================================================

echo Starting kiosk in hidden mode...
echo CMD window will minimize in 2 seconds...
timeout /t 2 /nobreak >nul

REM Launch kiosk with START command (opens in new process)
REM /MIN = Start minimized (CMD window hidden)
start /MIN cmd /c "cd /d C:\StudentKiosk && npm start"

REM Wait for kiosk to start
timeout /t 3 /nobreak >nul

REM Close this CMD window
exit
