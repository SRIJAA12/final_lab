@echo off
COLOR 0A
echo ========================================================
echo   STUDENT KIOSK - DIAGNOSE AND FIX ALL ISSUES
echo ========================================================
echo.

REM ===== CHECK 1: Node.js =====
echo [CHECK 1] Node.js installed?
where node >nul 2>&1
if %errorLevel% == 0 (
    echo    ✅ YES - Node.js found
    for /f "tokens=*" %%i in ('node --version') do echo    Version: %%i
) else (
    COLOR 0C
    echo    ❌ NO - Node.js is NOT installed!
    echo.
    echo    ===================================================
    echo    YOU MUST INSTALL NODE.JS FIRST!
    echo    Download from: https://nodejs.org/
    echo    Install it, then run this script again.
    echo    ===================================================
    echo.
    pause
    exit /b 1
)
echo.

REM ===== CHECK 2: npm =====
echo [CHECK 2] npm available?
where npm >nul 2>&1
if %errorLevel% == 0 (
    echo    ✅ YES - npm found
    for /f "tokens=*" %%i in ('npm --version') do echo    Version: %%i
) else (
    COLOR 0C
    echo    ❌ NO - npm is NOT available!
    echo    Reinstall Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo.

REM ===== CHECK 3: C:\StudentKiosk folder =====
echo [CHECK 3] C:\StudentKiosk folder exists?
if exist "C:\StudentKiosk" (
    echo    ✅ YES - Folder exists
) else (
    COLOR 0E
    echo    ❌ NO - C:\StudentKiosk does NOT exist!
    echo    FIXING: Running INSTALL_KIOSK.bat now...
    echo.
    call "%~dp0INSTALL_KIOSK.bat"
    echo.
    if exist "C:\StudentKiosk" (
        echo    ✅ FIXED - Folder created successfully
    ) else (
        echo    ❌ STILL MISSING - Installation failed!
        pause
        exit /b 1
    )
)
echo.

REM ===== CHECK 4: main-simple.js exists =====
echo [CHECK 4] Main kiosk file exists?
if exist "C:\StudentKiosk\main-simple.js" (
    echo    ✅ YES - main-simple.js found
) else (
    COLOR 0E
    echo    ❌ NO - main-simple.js missing!
    echo    FIXING: Copying files...
    xcopy "%~dp0student-kiosk\*" "C:\StudentKiosk\" /E /I /H /Y
    if exist "C:\StudentKiosk\main-simple.js" (
        echo    ✅ FIXED - Files copied
    ) else (
        echo    ❌ STILL MISSING - Copy failed!
        pause
        exit /b 1
    )
)
echo.

REM ===== CHECK 5: package.json exists =====
echo [CHECK 5] package.json exists?
if exist "C:\StudentKiosk\package.json" (
    echo    ✅ YES - package.json found
) else (
    COLOR 0C
    echo    ❌ NO - package.json missing!
    pause
    exit /b 1
)
echo.

REM ===== CHECK 6: server-config.json exists =====
echo [CHECK 6] server-config.json exists?
if exist "C:\StudentKiosk\server-config.json" (
    echo    ✅ YES - server-config.json found
    echo    Contents:
    type "C:\StudentKiosk\server-config.json"
    echo.
) else (
    COLOR 0E
    echo    ❌ NO - server-config.json missing!
    echo    FIXING: Copying config...
    if exist "%~dp0server-config.json" (
        copy "%~dp0server-config.json" "C:\StudentKiosk\server-config.json" /Y
    ) else if exist "%~dp0server-config.template.json" (
        copy "%~dp0server-config.template.json" "C:\StudentKiosk\server-config.json" /Y
    )
    if exist "C:\StudentKiosk\server-config.json" (
        echo    ✅ FIXED - Config copied
    ) else (
        echo    ❌ Could not copy config
    )
)
echo.

REM ===== CHECK 7: node_modules exists (npm install done?) =====
echo [CHECK 7] node_modules exists (dependencies installed)?
if exist "C:\StudentKiosk\node_modules" (
    echo    ✅ YES - node_modules found
) else (
    COLOR 0E
    echo    ❌ NO - Dependencies NOT installed!
    echo    FIXING: Running npm install (this may take 5-10 minutes)...
    echo.
    cd /d C:\StudentKiosk
    call npm install
    echo.
    if exist "C:\StudentKiosk\node_modules" (
        echo    ✅ FIXED - Dependencies installed
    ) else (
        echo    ❌ npm install FAILED!
        echo    Check internet connection and try again.
        pause
        exit /b 1
    )
)
echo.

REM ===== CHECK 8: Electron installed? =====
echo [CHECK 8] Electron installed?
if exist "C:\StudentKiosk\node_modules\electron" (
    echo    ✅ YES - Electron found
) else (
    COLOR 0E
    echo    ❌ NO - Electron NOT installed!
    echo    FIXING: Installing electron...
    cd /d C:\StudentKiosk
    call npm install electron
    if exist "C:\StudentKiosk\node_modules\electron" (
        echo    ✅ FIXED - Electron installed
    ) else (
        echo    ❌ Electron install FAILED!
        pause
        exit /b 1
    )
)
echo.

REM ===== CHECK 9: Registry auto-start entry =====
echo [CHECK 9] Auto-start registry entry exists?
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "StudentKiosk" >nul 2>&1
if %errorLevel% == 0 (
    echo    ✅ YES - Registry auto-start configured
    for /f "tokens=3*" %%a in ('reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "StudentKiosk" 2^>nul ^| findstr StudentKiosk') do echo    Value: %%a %%b
) else (
    COLOR 0E
    echo    ❌ NO - Auto-start NOT configured!
    echo    FIXING: Adding registry entry...
    reg add "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v "StudentKiosk" /t REG_SZ /d "wscript.exe \"C:\StudentKiosk\START_KIOSK_SILENT.vbs\"" /f
    echo    ✅ FIXED - Auto-start added to registry
)
echo.

REM ===== CHECK 10: START_KIOSK_SILENT.vbs exists =====
echo [CHECK 10] START_KIOSK_SILENT.vbs exists?
if exist "C:\StudentKiosk\START_KIOSK_SILENT.vbs" (
    echo    ✅ YES - Silent launcher found
) else (
    COLOR 0E
    echo    ❌ NO - Silent launcher missing!
    echo    FIXING: Creating launcher...
    (
        echo ' Student Kiosk - Silent Launcher
        echo Set WshShell = CreateObject^("WScript.Shell"^)
        echo kioskPath = "C:\StudentKiosk"
        echo command = "cmd /c ""cd /d """ ^& kioskPath ^& """ ^&^& npm start"""
        echo WshShell.Run command, 0, False
        echo Set WshShell = Nothing
    ) > "C:\StudentKiosk\START_KIOSK_SILENT.vbs"
    echo    ✅ FIXED - Launcher created
)
echo.

REM ===== TEST: Try to start the kiosk now =====
echo ========================================================
echo   ALL CHECKS COMPLETE!
echo ========================================================
echo.
echo Do you want to TEST the kiosk now? (Y/N)
set /p TEST_NOW="> "
if /i "%TEST_NOW%"=="Y" (
    echo.
    echo Starting kiosk... (visible CMD window for testing)
    echo Press Ctrl+C or close window to stop.
    echo.
    cd /d C:\StudentKiosk
    call npm start
) else (
    echo.
    echo OK. Restart your computer and the kiosk should auto-start!
    echo.
    echo To test manually, open CMD and run:
    echo    cd C:\StudentKiosk
    echo    npm start
)
echo.
pause
