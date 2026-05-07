@echo off
echo ================================================
echo   TESTING CONNECTION TO ADMIN SERVER
echo ================================================
echo.
echo Admin Server: 10.10.46.103
echo Port: 7401
echo.

echo Testing ping...
ping -n 2 10.10.46.103

echo.
echo Testing port 7401...
powershell Test-NetConnection -ComputerName 10.10.46.103 -Port 7401

echo.
echo If TcpTestSucceeded is True, connection is OK!
echo If False, check:
echo   1. Admin server is running
echo   2. Firewall allows port 7401
echo   3. Both systems are on same network
echo.
pause
