@echo off
title Uninstall Student Kiosk
color 0C
echo ================================================
echo     UNINSTALL STUDENT KIOSK
echo ================================================
echo.
echo This will completely remove the Student Kiosk from this system.
echo.
pause

echo.
echo [1/5] Stopping Kiosk if running...
taskkill /F /IM "Student Kiosk.exe" 2>nul
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/5] Removing Startup entries...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "StudentKiosk" /f 2>nul
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Student Kiosk.lnk" 2>nul

echo [2.1/5] Checking for shell replacement mode...
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell | find "KIOSK_SHELL_LAUNCHER.bat" >nul 2>&1
if %errorlevel%==0 (
    echo    ⚠️ WARNING: Kiosk is set as Windows shell!
    echo    Restoring Windows Explorer...
    reg add "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /t REG_SZ /d "explorer.exe" /f
    echo    ✅ Windows Explorer restored
) else (
    echo    Standard startup mode detected
)

echo [3/5] Removing Desktop shortcuts...
del "%USERPROFILE%\Desktop\Student Kiosk.lnk" 2>nul
del "%PUBLIC%\Desktop\Student Kiosk.lnk" 2>nul

echo [4/5] Removing installation folder...
if exist "C:\StudentKiosk\" (
    rd /s /q "C:\StudentKiosk\"
    echo    Deleted C:\StudentKiosk\
)

if exist "%LOCALAPPDATA%\StudentKiosk\" (
    rd /s /q "%LOCALAPPDATA%\StudentKiosk\"
    echo    Deleted %LOCALAPPDATA%\StudentKiosk\
)

echo [5/5] Cleaning up...
timeout /t 1 >nul

echo.
echo ================================================
echo    UNINSTALL COMPLETE!
echo ================================================
echo.
echo The Student Kiosk has been completely removed.
echo You can now install a fresh copy.
echo.
pause
