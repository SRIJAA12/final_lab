@echo off
echo ========================================================
echo   QUICK FIX FOR TSI ACCOUNT - REMOTE EXECUTION
echo ========================================================
echo.
echo This script will:
echo 1. Check if TSI student exists in database
echo 2. Fix missing password issue
echo 3. Test forgot password functionality
echo.

set SERVER_IP=192.168.1.100
echo Enter Server IP (or press Enter for %SERVER_IP%):
set /p INPUT_IP=
if not "%INPUT_IP%"=="" set SERVER_IP=%INPUT_IP%

echo.
echo Target Server: %SERVER_IP%
echo.

echo ========================================================
echo STEP 1: Testing Server Connection...
echo ========================================================
ping -n 1 %SERVER_IP% >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Cannot reach server!
    echo Please check:
    echo - Server IP address
    echo - Network connection
    echo - Server is powered on
    pause
    exit /b 1
)
echo [OK] Server is reachable
echo.

echo ========================================================
echo STEP 2: Running TSI Student Diagnostic...
echo ========================================================
echo Command: wmic /node:"%SERVER_IP%" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node fix-tsi-student.js > tsi-fix-output.txt 2>&1"
echo.
wmic /node:"%SERVER_IP%" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node fix-tsi-student.js > tsi-fix-output.txt 2>&1"
echo.
echo Waiting for script to complete...
timeout /t 8 >nul
echo.

echo ========================================================
echo STEP 3: Running Forgot Password Diagnostic...
echo ========================================================
echo Command: wmic /node:"%SERVER_IP%" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node diagnose-forgot-password.js > forgot-password-output.txt 2>&1"
echo.
wmic /node:"%SERVER_IP%" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node diagnose-forgot-password.js > forgot-password-output.txt 2>&1"
echo.
echo Waiting for script to complete...
timeout /t 8 >nul
echo.

echo ========================================================
echo STEP 4: Retrieving Results...
echo ========================================================
echo.
echo The diagnostic results have been saved to the server at:
echo    d:\screen_mirror_deployment\central-admin\server\tsi-fix-output.txt
echo    d:\screen_mirror_deployment\central-admin\server\forgot-password-output.txt
echo.
echo ========================================================
echo STEP 5: Reading Output Files (if accessible)...
echo ========================================================
echo.
echo Attempting to read results...
echo.

:: Try to read the output via network share (if available)
if exist "\\%SERVER_IP%\d$\screen_mirror_deployment\central-admin\server\tsi-fix-output.txt" (
    echo [TSI FIX OUTPUT]:
    echo ----------------
    type "\\%SERVER_IP%\d$\screen_mirror_deployment\central-admin\server\tsi-fix-output.txt"
    echo.
    echo.
    echo [FORGOT PASSWORD OUTPUT]:
    echo ------------------------
    type "\\%SERVER_IP%\d$\screen_mirror_deployment\central-admin\server\forgot-password-output.txt"
) else (
    echo Cannot access output files via network share.
    echo Please use AnyDesk to open these files on the server:
    echo    tsi-fix-output.txt
    echo    forgot-password-output.txt
)

echo.
echo ========================================================
echo NEXT STEPS:
echo ========================================================
echo.
echo 1. Use AnyDesk to open the output files on server
echo 2. Check if TSI student was found
echo 3. Check if password was auto-set to "password123"
echo 4. Try logging in with:
echo      Student ID: TSI### (whatever the ID is)
echo      Password: password123
echo.
echo 5. For Forgot Password:
echo      - Check if email is configured
echo      - If not, OTPs will appear in server console
echo      - Check server-log.txt for OTP codes
echo.
echo 6. If student not found:
echo      - Re-add student in student-management-system.html
echo      - Make sure ALL fields are filled
echo      - Use Student ID format: TSI001, TSI002, etc.
echo.

pause
