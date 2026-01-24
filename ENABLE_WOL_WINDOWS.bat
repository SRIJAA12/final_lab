@echo off
title Enable Wake-on-LAN (Windows Configuration)
color 0A

echo.
echo ============================================
echo   Wake-on-LAN Windows Configuration
echo ============================================
echo.
echo This will automatically configure:
echo   - Network adapter WoL settings
echo   - Power management settings
echo   - Fast Startup disable
echo   - Firewall rules
echo.
echo NO RESTART REQUIRED!
echo.
pause

echo.
echo Starting configuration...
echo.

REM Run PowerShell script as Administrator
powershell -ExecutionPolicy Bypass -File "%~dp0ENABLE_WOL_WINDOWS.ps1"

echo.
echo Done!
pause
