@echo off
echo ========================================
echo KIOSK DIAGNOSTIC - Why Keys Not Blocked?
echo ========================================
echo.

echo [1/6] Checking if old kiosk process is running...
tasklist | findstr /I "electron.exe"
if %ERRORLEVEL% EQU 0 (
    echo ❌ OLD KIOSK IS STILL RUNNING!
    echo.
    echo SOLUTION: Kill all electron processes:
    echo    taskkill /F /IM electron.exe /T
    echo.
    pause
    taskkill /F /IM electron.exe /T
    echo ✅ Killed all electron processes
) else (
    echo ✅ No electron processes running
)
echo.

echo [2/6] Checking if College Lab Kiosk exe is running...
tasklist | findstr /I "College"
if %ERRORLEVEL% EQU 0 (
    echo ❌ OLD KIOSK EXE IS STILL RUNNING!
    echo.
    echo SOLUTION: Kill the kiosk exe:
    taskkill /F /IM "College Lab Kiosk.exe" /T
    pause
) else (
    echo ✅ No kiosk exe running
)
echo.

echo [3/6] Checking kiosk file location...
if exist "C:\StudentKiosk\main-simple.js" (
    echo ✅ Found: C:\StudentKiosk\main-simple.js
    
    findstr /C:"KIOSK_MODE = true" "C:\StudentKiosk\main-simple.js" > nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ KIOSK_MODE = true (CORRECT)
    ) else (
        echo ❌ KIOSK_MODE = false (WRONG - Change to true!)
    )
    
    findstr /C:"forceKioskLock" "C:\StudentKiosk\main-simple.js" > nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ File has forceKioskLock function (NEW VERSION)
    ) else (
        echo ❌ File is OLD VERSION - needs update!
    )
    
    findstr /C:"'Escape'" "C:\StudentKiosk\main-simple.js" > nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Escape key blocking code exists
    ) else (
        echo ❌ NO ESCAPE BLOCKING CODE!
    )
) else (
    echo ❌ File NOT found at C:\StudentKiosk\main-simple.js
    echo    Check if kiosk is installed in different location
)
echo.

echo [4/6] Checking current directory...
cd
echo.
dir main-simple.js 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ main-simple.js exists in current directory
) else (
    echo ⚠️ main-simple.js not in current directory
)
echo.

echo [5/6] Checking for multiple kiosk installations...
echo Searching for all main-simple.js files...
dir /S /B main-simple.js 2>nul
echo.

echo [6/6] Testing globalShortcut capability...
echo Creating test file...
(
echo const { app, globalShortcut } = require('electron'^);
echo app.whenReady('^).then('^('^) =^> {
echo   const ok = globalShortcut.register('Escape', ('^) =^> {
echo     console.log('Escape blocked!'^);
echo   }'^);
echo   console.log('Escape registration:', ok ? 'SUCCESS' : 'FAILED'^);
echo   setTimeout('^('^) =^> app.quit('^), 3000'^);
echo }'^);
) > test-shortcut.js

echo.
echo ========================================
echo DIAGNOSTIC COMPLETE
echo ========================================
echo.
echo MOST COMMON ISSUES:
echo.
echo 1. ❌ OLD KIOSK STILL RUNNING
echo    Fix: Kill all electron.exe processes
echo    Command: taskkill /F /IM electron.exe /T
echo.
echo 2. ❌ RUNNING OLD VERSION OF FILE
echo    Fix: Make sure you copied NEW main-simple.js
echo    To: C:\StudentKiosk\main-simple.js
echo.
echo 3. ❌ KIOSK_MODE = false
echo    Fix: Edit main-simple.js, change to:
echo    const KIOSK_MODE = true;
echo.
echo 4. ❌ NOT RESTARTING KIOSK AFTER COPYING FILE
echo    Fix: Close kiosk completely, then restart
echo.
echo 5. ❌ TESTING FROM WRONG DIRECTORY
echo    Fix: Navigate to C:\StudentKiosk
echo    Then run: npm start
echo.
echo ========================================
echo.
echo RECOMMENDED ACTIONS:
echo.
echo 1. Kill all electron processes:
echo    taskkill /F /IM electron.exe /T
echo.
echo 2. Navigate to kiosk folder:
echo    cd C:\StudentKiosk
echo.
echo 3. Start kiosk fresh:
echo    npm start
echo.
echo 4. Test Escape key - should be COMPLETELY BLOCKED
echo.
echo ========================================
pause
