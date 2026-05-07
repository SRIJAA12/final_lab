@echo off
echo ================================================
echo   SET SYSTEM NUMBER
echo ================================================
echo.
echo This will set the SYSTEM_NUMBER environment variable
echo Examples: PC-01, PC-02, PC-03, etc.
echo.

set /p SYS_NUM="Enter System Number (e.g., PC-01): "

if "%SYS_NUM%"=="" (
    echo ERROR: System number cannot be empty!
    pause
    exit /b
)

echo.
echo Setting SYSTEM_NUMBER to: %SYS_NUM%
setx SYSTEM_NUMBER "%SYS_NUM%" /M

echo.
echo ================================================
echo   DONE!
echo ================================================
echo.
echo System Number: %SYS_NUM%
echo.
echo NOTE: You need to restart the computer or
echo open a NEW command prompt for this to take effect.
echo.
pause
