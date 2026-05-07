@echo off
REM ==================================================================
REM RESTORE WINDOWS EXPLORER SHELL
REM ==================================================================
REM This restores the normal Windows Explorer shell after using
REM shell replacement mode.
REM ==================================================================

echo ================================================
echo   RESTORE WINDOWS EXPLORER SHELL
echo ================================================
echo.
echo This will restore the normal Windows desktop.
echo.
pause

REM Restore default Windows shell
reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /t REG_SZ /d "explorer.exe" /f

echo.
echo ================================================
echo   SHELL RESTORED!
echo ================================================
echo.
echo Windows Explorer has been restored as the shell.
echo Restart your computer to apply changes.
echo.
pause
