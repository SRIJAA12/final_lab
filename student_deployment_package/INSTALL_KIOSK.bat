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
copy "%~dp0server-config.json" "C:\StudentKiosk\server-config.json" /Y
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

REM Create startup batch file
echo [5/6] Setting up auto-start...
(
echo @echo off
echo cd /d C:\StudentKiosk
echo start /min npm start
) > "C:\StudentKiosk\START_KIOSK.bat"

REM Add to Windows startup
reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "StudentKiosk" /t REG_SZ /d "C:\StudentKiosk\START_KIOSK.bat" /f

REM Create desktop shortcut
echo [6/6] Creating desktop shortcut...
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\Student Kiosk.lnk');$s.TargetPath='C:\StudentKiosk\START_KIOSK.bat';$s.WorkingDirectory='C:\StudentKiosk';$s.Save()"

echo.
echo ================================================
echo   INSTALLATION COMPLETE!
echo ================================================
echo.
echo VERIFICATION:
echo - Installation folder: C:\StudentKiosk
echo - Config file: C:\StudentKiosk\server-config.json
echo - Server IP: 10.10.46.103:7401
echo.
echo IMPORTANT - VERIFY CONFIG:
type "C:\StudentKiosk\server-config.json"
echo.
echo Next steps:
echo 1. Make sure admin server is running at 10.10.46.103:7401
echo 2. Test manually: cd C:\StudentKiosk && npm start
echo 3. After successful test, restart computer
echo.
echo The kiosk will auto-start after restart in FULL LOCKDOWN mode!
echo.
pause
