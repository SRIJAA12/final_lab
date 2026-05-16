@echo off
REM ==================================================================
REM UPDATE EXISTING KIOSK INSTALLATION
REM ==================================================================
REM Run this on student computers that already have the kiosk installed
REM This updates the code to fix security issues
REM ==================================================================

echo ================================================
echo   UPDATE EXISTING KIOSK INSTALLATION
echo ================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator privileges required!
    echo Right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

REM Check if kiosk exists
if not exist "C:\StudentKiosk\main-simple.js" (
    echo ERROR: Kiosk not found at C:\StudentKiosk
    echo Please install the kiosk first!
    echo.
    pause
    exit /b 1
)

echo [1/5] Stopping existing kiosk...
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/5] Backing up old files...
if not exist "C:\StudentKiosk\backup" mkdir "C:\StudentKiosk\backup"
copy /Y "C:\StudentKiosk\main-simple.js" "C:\StudentKiosk\backup\main-simple.js.backup" >nul 2>&1

echo [3/5] Updating kiosk files with screen mirroring fixes...

REM Copy main process
copy /Y "%~dp0student-kiosk\main-simple.js" "C:\StudentKiosk\main-simple.js"
if %errorLevel% neq 0 (
    echo ERROR: Failed to copy main-simple.js!
    pause
    exit /b 1
)
echo    ✅ main-simple.js updated (screen auto-select fix)

REM Copy renderer (screen capture + WebRTC)
copy /Y "%~dp0student-kiosk\renderer.js" "C:\StudentKiosk\renderer.js"
echo    ✅ renderer.js updated (LAN-only WebRTC, reduced resolution)

REM Copy kiosk interface HTML (screen capture + WebRTC)
copy /Y "%~dp0student-kiosk\student-interface.html" "C:\StudentKiosk\student-interface.html"
echo    ✅ student-interface.html updated

REM Copy renderer-fixed.js
copy /Y "%~dp0student-kiosk\renderer-fixed.js" "C:\StudentKiosk\renderer-fixed.js"
echo    ✅ renderer-fixed.js updated

echo [4/5] Installing startup scripts...
copy /Y "%~dp0student-kiosk\START_KIOSK_SILENT.vbs" "C:\StudentKiosk\START_KIOSK_SILENT.vbs"
copy /Y "%~dp0student-kiosk\START_KIOSK_BACKGROUND.bat" "C:\StudentKiosk\START_KIOSK_BACKGROUND.bat"

echo [5/5] Configuring shell replacement (blocks everything)...
echo.
echo This will make the kiosk replace Windows Explorer.
echo After restart:
echo - NO desktop, taskbar, or start menu
echo - Kiosk login appears immediately after Windows login
echo - Maximum security
echo.
set /p CONFIRM="Do you want to enable shell replacement? (Y/N): "
if /i "%CONFIRM%"=="Y" (
    echo.
    echo Creating shell launcher...
    (
        echo Set WshShell = CreateObject^("WScript.Shell"^)
        echo kioskPath = "C:\StudentKiosk"
        echo command = "cmd /c ""cd /d """ ^& kioskPath ^& """ ^^&^^& npm start > nul 2>^^&1"""
        echo WshShell.Run command, 0, False
        echo Set WshShell = Nothing
    ) > "C:\StudentKiosk\KIOSK_SHELL_LAUNCHER.vbs"
    
    echo Backing up registry...
    reg export "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" "C:\StudentKiosk\SHELL_BACKUP.reg" /y >nul 2>&1
    
    echo Replacing Windows Shell...
    reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /t REG_SZ /d "wscript.exe C:\StudentKiosk\KIOSK_SHELL_LAUNCHER.vbs" /f >nul 2>&1
    
    echo ✅ Shell replacement configured!
) else (
    echo Shell replacement skipped.
    echo Kiosk will run as normal application with auto-start.
    
    echo Setting up auto-start...
    reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v StudentKiosk /t REG_SZ /d "wscript.exe C:\StudentKiosk\START_KIOSK_SILENT.vbs" /f >nul 2>&1
    echo ✅ Auto-start configured!
)

echo.
echo ================================================
echo   UPDATE COMPLETE!
echo ================================================
echo.
echo Security fixes applied:
echo ✅ Timer window: No menus (File/Edit/View removed)
echo ✅ Timer window: Dev tools blocked (F12, Ctrl+Shift+I)
echo ✅ Timer window: Refresh blocked (Ctrl+R, F5)
echo ✅ Logout: Returns to kiosk login (no shutdown)
echo ✅ Startup: No CMD window visible
echo.
echo NEXT STEP: Restart this computer
echo.
set /p RESTART="Restart now? (Y/N): "
if /i "%RESTART%"=="Y" (
    echo Restarting in 5 seconds...
    shutdown /r /t 5
) else (
    echo Please restart manually for changes to take effect!
    pause
)
