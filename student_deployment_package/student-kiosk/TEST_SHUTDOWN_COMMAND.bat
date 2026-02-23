@echo off
echo ========================================
echo  TESTING WINDOWS SHUTDOWN COMMAND
echo ========================================
echo.
echo This will test if shutdown command works
echo.
echo Testing shutdown with 60 second timer...
echo (You can cancel with: shutdown /a)
echo.

REM Test 1: Basic shutdown command (60 seconds)
echo Test 1: Basic shutdown /s /t 60
shutdown /s /t 60 /c "Test shutdown - will be cancelled"

if %errorLevel% == 0 (
    echo ✅ SUCCESS: Shutdown command accepted
    echo.
    echo Cancelling shutdown now...
    shutdown /a
    
    if %errorLevel% == 0 (
        echo ✅ SUCCESS: Shutdown cancelled
    ) else (
        echo ❌ FAILED to cancel - may need admin rights
    )
) else (
    echo ❌ FAILED: Shutdown command rejected
    echo Error code: %errorLevel%
    echo.
    echo This usually means:
    echo  - No administrator privileges
    echo  - Windows policy blocking shutdown
    echo.
    echo To fix: Run this script as administrator
    echo  1. Right-click this file
    echo  2. Select "Run as administrator"
)

echo.
echo ========================================
echo Test complete
echo ========================================
pause
