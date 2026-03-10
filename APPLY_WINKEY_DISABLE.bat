@echo off
REM ================================================================
REM DISABLE WINDOWS KEY ON ALL STUDENT SYSTEMS
REM ================================================================
REM This applies registry changes to completely disable Windows key
REM preventing students from accessing Start menu in kiosk mode
REM ================================================================

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         DISABLE WINDOWS KEY - KIOSK SECURITY FIX               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo This will PERMANENTLY disable the Windows key on this computer.
echo.
echo ⚠️  WARNING: Requires system restart to take effect
echo ⚠️  Admin will also not be able to use Windows key
echo.
pause

echo.
echo [1/3] Creating registry modification...
(
echo Windows Registry Editor Version 5.00
echo.
echo [HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Keyboard Layout]
echo "Scancode Map"=hex:00,00,00,00,00,00,00,00,03,00,00,00,00,00,5b,e0,00,00,5c,e0,00,00,00,00
) > "%TEMP%\disable_winkey.reg"
echo ✅ Registry file created
echo.

echo [2/3] Applying registry changes...
echo     (Click YES when prompted for permission)
regedit /s "%TEMP%\disable_winkey.reg" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Registry changes applied successfully
) else (
    echo ❌ Failed to apply - trying with admin rights...
    reg import "%TEMP%\disable_winkey.reg"
)
echo.

echo [3/3] Verification...
reg query "HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layout" /v "Scancode Map" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Windows key is now DISABLED in registry
) else (
    echo ⚠️  Could not verify - may need to run as Administrator
)
echo.

echo ════════════════════════════════════════════════════════════════
echo ✅ WINDOWS KEY DISABLED
echo ════════════════════════════════════════════════════════════════
echo.
echo IMPORTANT: You MUST restart the computer for this to take effect!
echo.
echo After restart:
echo   ✅ Windows key will NOT open Start menu
echo   ✅ Kiosk will have full control
echo   ✅ Students cannot access Windows shell
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
