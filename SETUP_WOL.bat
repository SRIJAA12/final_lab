@echo off
title Wake-on-LAN Setup
color 0E

echo.
echo ============================================================
echo   Wake-on-LAN Setup Wizard
echo ============================================================
echo.
echo This will configure the admin system MAC address for
echo Wake-on-LAN functionality.
echo.
pause

cd /d "%~dp0central-admin\server"

echo.
echo Installing required packages...
call npm install wake_on_lan --save

echo.
echo ============================================================
echo   Running Setup...
echo ============================================================
echo.

node wol-setup.js

echo.
echo ============================================================
echo   Setup Complete
echo ============================================================
echo.
pause
