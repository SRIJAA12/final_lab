@echo off
REM ==================================================================
REM COMPLETE STUDENT KIOSK DEPLOYMENT - ONE CLICK INSTALL
REM ==================================================================
REM Run this script AS ADMINISTRATOR on the student system
REM ==================================================================

echo ================================================
echo   STUDENT KIOSK - COMPLETE DEPLOYMENT
echo ================================================
echo.
echo This will:
echo 1. Install kiosk to C:\StudentKiosk
echo 2. Configure connection to admin server (10.10.46.103)
echo 3. Set up SILENT auto-start (NO CMD window)
echo 4. Replace Windows Shell for maximum security
echo.
echo REQUIREMENTS:
echo - Node.js must be installed
echo - Run this as Administrator
echo - Admin server must be running at 10.10.46.103
echo.
pause

REM Check if running as admin
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Download from https://nodejs.org/
    echo 2. Run the installer
    echo 3. Restart this script
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Administrator rights confirmed
echo ✅ Node.js found: 
node --version
echo.

REM =================================================================
REM STEP 1: CREATE INSTALLATION DIRECTORY
REM =================================================================
echo [1/7] Creating installation directory...
if not exist "C:\StudentKiosk" mkdir "C:\StudentKiosk"
if not exist "C:\StudentKiosk\assets" mkdir "C:\StudentKiosk\assets"

REM =================================================================
REM STEP 2: COPY KIOSK FILES
REM =================================================================
echo [2/7] Copying kiosk files...
xcopy "%~dp0student-kiosk\*" "C:\StudentKiosk\" /E /I /H /Y

REM =================================================================
REM STEP 3: CREATE SERVER CONFIGURATION
REM =================================================================
echo [3/7] Configuring server connection...
(
echo {
echo   "serverIp": "10.10.46.103",
echo   "serverPort": 7401,
echo   "reconnectInterval": 5000
echo }
) > "C:\StudentKiosk\server-config.json"

echo.
echo Server configuration created:
type "C:\StudentKiosk\server-config.json"
echo.

REM =================================================================
REM STEP 4: INSTALL NPM DEPENDENCIES
REM =================================================================
echo [4/7] Installing dependencies (this may take 5-10 minutes)...
cd /d C:\StudentKiosk
call npm install --production

if %errorLevel% NEQ 0 (
    echo.
    echo ERROR: npm install failed!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM =================================================================
REM STEP 5: CREATE SILENT LAUNCHER (NO CMD WINDOW)
REM =================================================================
echo [5/7] Creating SILENT launcher (NO CMD window)...
(
echo ' Student Kiosk - Silent Launcher ^(COMPLETELY HIDDEN^)
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo kioskPath = "C:\StudentKiosk"
echo command = "cmd /c ""cd /d """ ^& kioskPath ^& """ ^^^&^^^& npm start ^> nul 2^>^^^&1"""
echo WshShell.Run command, 0, False
echo Set WshShell = Nothing
) > "C:\StudentKiosk\START_KIOSK_SILENT.vbs"

echo ✅ Silent launcher created

REM =================================================================
REM STEP 6: REPLACE WINDOWS SHELL (KIOSK ON LOGIN)
REM =================================================================
echo [6/7] Replacing Windows Shell for immediate kiosk launch...
echo.
echo WARNING: This will make the kiosk launch IMMEDIATELY after login
echo          No Windows desktop, taskbar, or start menu will appear
echo          Maximum security mode!
echo.
echo To restore Windows later, boot to Safe Mode and run:
echo    C:\StudentKiosk\RESTORE_EXPLORER_SHELL.bat
echo.
pause

REM Backup current shell
reg export "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" "C:\StudentKiosk\SHELL_BACKUP.reg" /y

REM Create shell launcher VBScript
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo kioskPath = "C:\StudentKiosk"
echo command = "cmd /c ""cd /d """ ^& kioskPath ^& """ ^^^&^^^& npm start ^> nul 2^>^^^&1"""
echo WshShell.Run command, 0, False
echo Set WshShell = Nothing
) > "C:\StudentKiosk\KIOSK_SHELL_LAUNCHER.vbs"

REM Replace Windows Shell
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /t REG_SZ /d "wscript.exe C:\StudentKiosk\KIOSK_SHELL_LAUNCHER.vbs" /f

REM Create restore script
(
echo @echo off
echo echo Restoring Windows Explorer as shell...
echo reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /t REG_SZ /d "explorer.exe" /f
echo echo.
echo echo ✅ Windows Explorer restored!
echo echo Please restart your computer.
echo pause
) > "C:\StudentKiosk\RESTORE_EXPLORER_SHELL.bat"

echo ✅ Windows Shell replaced with kiosk

REM =================================================================
REM STEP 7: SET SYSTEM NUMBER (OPTIONAL)
REM =================================================================
echo [7/7] Setting system number...
echo.
set /p SYSNUM="Enter system number (e.g., PC-01, PC-02, etc.): "
if "%SYSNUM%"=="" set SYSNUM=PC-UNKNOWN

setx SYSTEM_NUMBER "%SYSNUM%" /M
echo ✅ System number set to: %SYSNUM%

REM =================================================================
REM INSTALLATION COMPLETE
REM =================================================================
echo.
echo ================================================
echo   INSTALLATION COMPLETE!
echo ================================================
echo.
echo 📁 Installation folder: C:\StudentKiosk
echo 🔧 Configuration: C:\StudentKiosk\server-config.json
echo 🌐 Admin Server: 10.10.46.103:7401
echo 🔒 Security: Maximum (Shell replacement enabled)
echo 💻 System ID: %SYSNUM%
echo.
echo SECURITY FEATURES:
echo ✅ Silent launcher - ZERO CMD windows visible
echo ✅ Kiosk replaces Windows shell
echo ✅ Launches IMMEDIATELY after login
echo ✅ NO desktop, taskbar, or Windows interface
echo ✅ Maximum lockdown mode
echo.
echo WHAT HAPPENS NEXT:
echo 1. Computer will restart in 30 seconds
echo 2. After login, kiosk will appear INSTANTLY
echo 3. NO Windows interface will be visible
echo 4. Students can only access the kiosk
echo.
echo TO RESTORE WINDOWS (if needed):
echo 1. Boot to Safe Mode (F8 during startup)
echo 2. Run: C:\StudentKiosk\RESTORE_EXPLORER_SHELL.bat
echo 3. Restart normally
echo.
echo BACKUP FILES SAVED:
echo - C:\StudentKiosk\SHELL_BACKUP.reg (registry backup)
echo - C:\StudentKiosk\RESTORE_EXPLORER_SHELL.bat (restore script)
echo.
echo Press Ctrl+C to cancel restart, or wait 30 seconds...
timeout /t 30

REM Restart computer
shutdown /r /t 5 /c "Restarting to activate Student Kiosk in maximum security mode"

echo.
echo Restarting in 5 seconds...
echo.
