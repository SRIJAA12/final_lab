@echo off
title Lab Management System - Server

REM Get the IP address from .env or use default
set SERVER_IP=10.10.46.103
set SERVER_PORT=7401

cls
echo.
echo ================================================================
echo           LAB MANAGEMENT SYSTEM - STARTING...
echo ================================================================
echo.
echo  Status: Starting Node.js server...
echo  Location: central-admin\server
echo.
echo ================================================================
echo.

REM Change to server directory
cd /d "%~dp0central-admin\server"

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if app.js exists
if not exist "app.js" (
    echo.
    echo ERROR: app.js not found!
    echo Make sure you're running this from the correct directory.
    echo.
    pause
    exit /b 1
)

echo.
echo Starting server... Browser will open automatically in 2 seconds.
echo.
echo IMPORTANT: Keep this window open while using the system!
echo.
echo ================================================================
echo.

REM Start node server (this will auto-open browser after 1 second from server code)
node app.js

REM If the server stops, show message
echo.
echo ================================================================
echo  Server has stopped!
echo  Press any key to restart or close this window to exit.
echo ================================================================
pause >nul
goto :EOF
