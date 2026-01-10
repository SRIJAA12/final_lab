@echo off
echo ============================================
echo   REMOTE TSI ACCOUNT & PASSWORD RESET DIAGNOSTIC
echo ============================================
echo.

:: Get server IP from config
set SERVER_IP=192.168.1.100
echo Enter the Server IP address (or press Enter for %SERVER_IP%):
set /p INPUT_IP=
if not "%INPUT_IP%"=="" set SERVER_IP=%INPUT_IP%

echo.
echo Using Server IP: %SERVER_IP%
echo.

echo ============================================
echo 1. CHECKING IF SERVER IS ACCESSIBLE...
echo ============================================
ping -n 1 %SERVER_IP% >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Cannot reach server at %SERVER_IP%
    echo Please check network connection and server IP
    pause
    exit /b 1
) else (
    echo [OK] Server is reachable
)
echo.

echo ============================================
echo 2. CHECKING IF NODE SERVER IS RUNNING...
echo ============================================
wmic /node:"%SERVER_IP%" process where "name='node.exe'" get ProcessId,CommandLine 2>nul
if errorlevel 1 (
    echo [ERROR] Cannot access server via WMIC
    echo Make sure:
    echo - WMI is enabled on server
    echo - Firewall allows WMIC
    echo - You have admin rights
    pause
    exit /b 1
)
echo.

echo ============================================
echo 3. CHECKING SERVER LOG FOR RECENT ERRORS...
echo ============================================
echo Attempting to read server logs remotely...
wmic /node:"%SERVER_IP%" process call create "cmd /c type d:\screen_mirror_deployment\central-admin\server\server-log.txt" 2>nul
echo.

echo ============================================
echo 4. CHECKING MONGODB CONNECTION...
echo ============================================
echo Running database verification script...
wmic /node:"%SERVER_IP%" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node test-db-connection.js > db-check-result.txt 2>&1" 2>nul
timeout /t 5 >nul
echo.

echo ============================================
echo 5. CHECKING FOR STUDENT 'subhahrini'...
echo ============================================
echo Creating verification script...

:: Create a temporary check script on the server
wmic /node:"%SERVER_IP%" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node check-students.js > student-check-result.txt 2>&1" 2>nul
timeout /t 5 >nul
echo Check completed - see student-check-result.txt on server
echo.

echo ============================================
echo 6. CHECKING EMAIL CONFIGURATION...
echo ============================================
echo Testing email setup for forgot password...
wmic /node:"%SERVER_IP%" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node test-email.js > email-check-result.txt 2>&1" 2>nul
timeout /t 5 >nul
echo.

echo ============================================
echo 7. SUGGESTED NEXT STEPS:
echo ============================================
echo.
echo A. To check student database manually:
echo    - Use AnyDesk to open MongoDB on server
echo    - Or run: node check-students.js on server
echo.
echo B. To verify TSI student credentials:
echo    - Student ID should be in format: TSI###
echo    - Email should be valid and unique
echo    - Password should be set
echo.
echo C. For forgot password issue:
echo    - Check email configuration in .env file
echo    - Verify SMTP settings
echo    - Check if OTP is being generated
echo.
echo D. Common fixes:
echo    - Re-add student through student-management-system.html
echo    - Ensure email is configured in server
echo    - Check server logs for errors
echo.

pause
