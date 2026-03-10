@echo off
REM ================================================================
REM ENABLE WINDOWS KEY - UNDO THE DISABLE
REM ================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         ENABLE WINDOWS KEY - RESTORE NORMAL FUNCTION           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo This will RE-ENABLE the Windows key on this computer.
echo.
pause

echo.
echo [1/2] Removing Scancode Map from registry...
reg delete "HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layout" /v "Scancode Map" /f >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo ✅ Scancode Map removed successfully
) else (
    echo ⚠️  Scancode Map was not found or needs admin rights
    echo     Try running this script as Administrator
)
echo.

echo [2/2] Verification...
reg query "HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layout" /v "Scancode Map" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Scancode Map still exists - run as Administrator
) else (
    echo ✅ Windows key is now ENABLED in registry
)
echo.

echo ════════════════════════════════════════════════════════════════
echo ✅ WINDOWS KEY RE-ENABLED
echo ════════════════════════════════════════════════════════════════
echo.
echo IMPORTANT: You MUST restart the computer for this to take effect!
echo.
echo Do you want to restart NOW? (Y/N)
set /p RESTART_NOW="> "

if /I "%RESTART_NOW%"=="Y" (
    echo.
    echo Restarting in 10 seconds...
    echo Press Ctrl+C to cancel
    timeout /t 10
    shutdown /r /t 0
) else (
    echo.
    echo Remember to restart manually for changes to take effect!
)

pause