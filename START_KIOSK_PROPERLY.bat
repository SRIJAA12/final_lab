@echo off
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║           START KIOSK PROPERLY - NO CMD INTERFERENCE           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo ⚠️  IMPORTANT: This will start kiosk WITHOUT showing CMD window
echo              This allows kiosk to have FULL keyboard control
echo.
pause

echo.
echo [1/3] Killing any existing kiosk processes...
taskkill /F /IM electron.exe /T >nul 2>&1
taskkill /F /IM "College Lab Kiosk.exe" /T >nul 2>&1
echo ✅ Cleaned up old processes
echo.

echo [2/3] Creating hidden launcher...
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.Run "cmd /c cd /d C:\StudentKiosk ^^^&^^^& npm start", 0, False
echo Set WshShell = Nothing
) > "%TEMP%\launch_kiosk.vbs"
echo ✅ Launcher created
echo.

echo [3/3] Starting kiosk in HIDDEN mode...
start "" "%TEMP%\launch_kiosk.vbs"
timeout /t 3 /nobreak >nul
echo.

echo ════════════════════════════════════════════════════════════════
echo ✅ KIOSK STARTED - NO CMD WINDOW!
echo ════════════════════════════════════════════════════════════════
echo.
echo The kiosk is now running WITHOUT a CMD window in background.
echo This means Windows gives FULL control to the kiosk.
echo.
echo NOW TEST:
echo   1. Press Escape → Should be BLOCKED
echo   2. Press Windows key → Should be BLOCKED  
echo   3. Press F12 → Should be BLOCKED
echo.
echo If these are STILL working:
echo   - Check if KIOSK_MODE = true in main-simple.js
echo   - Check console for "✅ OS-level Escape blocked"
echo.
echo This CMD window will close in 5 seconds...
timeout /t 5 /nobreak >nul
exit
