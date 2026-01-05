@echo off
REM ========================================
REM VERIFY LAB NETWORK CONNECTIVITY
REM ========================================
echo.
echo ========================================
echo   LAB NETWORK VERIFICATION
echo ========================================
echo.

REM Get admin IP from server-config.json
if exist "server-config.json" (
    echo [INFO] Reading server config...
    findstr "serverIp" server-config.json
    echo.
) else (
    echo [WARNING] server-config.json not found
    echo.
)

REM Check local IP address
echo [1/4] Checking your IP address...
echo.
ipconfig | findstr /C:"IPv4 Address"
echo.

REM Set admin IP (change this to match your admin system IP)
set ADMIN_IP=192.168.1.1

echo [2/4] Testing connection to admin system (%ADMIN_IP%)...
echo.
ping -n 2 %ADMIN_IP%
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Admin system is reachable
) else (
    echo       ❌ Cannot reach admin system
    echo       Please verify:
    echo       - Admin IP is correct (%ADMIN_IP%)
    echo       - Both systems are on same network
    echo       - Firewall is not blocking
)
echo.

echo [3/4] Testing connection to server...
echo.
curl -s http://%ADMIN_IP%:7401 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       ✅ Server is accessible
) else (
    echo       ❌ Cannot reach server
    echo       Please verify:
    echo       - Server is running on admin system
    echo       - Port 7401 is open in firewall
)
echo.

echo [4/4] Testing MongoDB connection...
echo.
REM Note: This only works if MongoDB is accessible
curl -s http://%ADMIN_IP%:27017 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       ✅ MongoDB port is accessible
) else (
    echo       ⚠️  MongoDB port not accessible (may be normal if MongoDB is only local)
)
echo.

echo ========================================
echo   VERIFICATION COMPLETE
echo ========================================
echo.
echo Next steps:
echo 1. If admin system is reachable: Start kiosk app
echo 2. If server is accessible: Try logging in
echo 3. If issues persist: Check firewall settings
echo.
pause
