@echo off
echo ================================================
echo   STUDENT KIOSK INSTALLATION
echo ================================================
echo.
echo Admin Server IP: 10.10.46.103
echo.

REM Install to C:\StudentKiosk
echo [1/6] Creating installation directory...
if not exist "C:\StudentKiosk" mkdir "C:\StudentKiosk"

REM Copy files
echo [2/6] Copying kiosk files...
xcopy "%~dp0student-kiosk\*" "C:\StudentKiosk\" /E /I /H /Y

REM Copy server config to MULTIPLE locations to ensure it's found
echo [3/6] Configuring server connection...
if exist "%~dp0server-config.json" (
    copy "%~dp0server-config.json" "C:\StudentKiosk\server-config.json" /Y
) else (
    copy "%~dp0server-config.template.json" "C:\StudentKiosk\server-config.json" /Y
)
echo Server config copied to C:\StudentKiosk\server-config.json

REM Verify config file exists and show contents
echo.
echo Verifying server configuration...
type "C:\StudentKiosk\server-config.json"
echo.

REM Install dependencies
echo [4/6] Installing dependencies (this may take a few minutes)...
cd /d C:\StudentKiosk
call npm install

REM Create silent VBScript launcher (NO CMD WINDOW)
echo [5/6] Setting up auto-start with SILENT launcher...
(
echo ' Student Kiosk - Silent Launcher
echo Set WshShell = CreateObject("WScript.Shell"^)
echo kioskPath = "C:\StudentKiosk"
echo command = "cmd /c cd /d """ ^& kioskPath ^& """ ^^^&^^^& start /B npm start"
echo WshShell.Run command, 0, False
echo Set WshShell = Nothing
) > "C:\StudentKiosk\START_KIOSK_SILENT.vbs"

REM Create background batch launcher as backup
(
echo @echo off
echo cd /d C:\StudentKiosk
echo start /B npm start
echo exit
) > "C:\StudentKiosk\START_KIOSK_BACKGROUND.bat"

REM Add VBScript launcher to Windows startup (NO CMD WINDOW VISIBLE)
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "StudentKiosk" /t REG_SZ /d "wscript.exe \"C:\StudentKiosk\START_KIOSK_SILENT.vbs\"" /f

echo.
echo ✅ Silent launcher configured - NO CMD WINDOW will be visible!

REM Create desktop shortcut
echo [6/6] Creating desktop shortcut...
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\Student Kiosk.lnk');$s.TargetPath='C:\StudentKiosk\START_KIOSK.bat';$s.WorkingDirectory='C:\StudentKiosk';$s.Save()"

echo.
echo ================================================
echo   INSTALLATION COMPLETE!
echo ================================================
echo.
echo SECURITY FEATURES ENABLED:
echo - ✅ Silent launcher - NO CMD window visible
echo - ✅ Kiosk runs as independent background process
echo - ✅ Closing any window will NOT terminate kiosk
echo - ✅ Full-screen lock enabled from startup
echo.
echo VERIFICATION:
echo - Installation folder: C:\StudentKiosk
echo - Config file: C:\StudentKiosk\server-config.json
echo - Server IP: 10.10.46.103:7401
echo - Silent launcher: C:\StudentKiosk\START_KIOSK_SILENT.vbs
echo.
echo IMPORTANT - VERIFY CONFIG:
type "C:\StudentKiosk\server-config.json"
echo.
echo Next steps:
echo 1. Make sure admin server is running at 10.10.46.103:7401
echo 2. Test manually: wscript "C:\StudentKiosk\START_KIOSK_SILENT.vbs"
echo 3. After successful test, restart computer
echo.
echo The kiosk will auto-start after restart in FULL LOCKDOWN mode!
echo NO CMD WINDOW will be visible to students!
echo.
pause
