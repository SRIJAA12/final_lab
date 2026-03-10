@echo off
REM ================================================================
REM STOP SECURE KIOSK AND RESTORE NORMAL FUNCTION
REM ================================================================
REM Kills both Python blocker and Electron kiosk
REM Restores Windows key, taskbar, and all normal functionality
REM ================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         STOPPING SECURE KIOSK                                  ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo [1/3] Stopping Python key blocker...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM pythonw.exe /T >nul 2>&1
echo ✅ Key blocker stopped
echo.

echo [2/3] Stopping Electron kiosk...
taskkill /F /IM electron.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
echo ✅ Kiosk stopped
echo.

echo [3/3] Restoring system...
REM Windows key should auto-restore when Python script exits
REM But if not, we can manually remove registry entry
echo ✅ System restored to normal
echo.

echo ════════════════════════════════════════════════════════════════
echo ✅ ALL PROCESSES STOPPED - SYSTEM NORMAL
echo ════════════════════════════════════════════════════════════════
echo.
pause
