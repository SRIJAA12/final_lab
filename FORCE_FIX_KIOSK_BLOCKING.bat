@echo off
echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  🔧 KIOSK EMERGENCY FIX - STOP ESCAPE/WINDOWS KEYS            ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo This will FORCE KILL and RESTART the kiosk with proper blocking
echo.
pause

echo.
echo [STEP 1/5] Killing ALL electron processes...
echo ════════════════════════════════════════════════════════════════
taskkill /F /IM electron.exe /T 2>nul
taskkill /F /IM "College Lab Kiosk.exe" /T 2>nul
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak >nul
echo ✅ All kiosk processes killed
echo.

echo [STEP 2/5] Verifying KIOSK_MODE is set to TRUE...
echo ════════════════════════════════════════════════════════════════
cd /d C:\StudentKiosk 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: C:\StudentKiosk folder not found!
    echo    Create folder or check installation location
    pause
    exit /b 1
)

findstr /C:"KIOSK_MODE = true" main-simple.js > nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ KIOSK_MODE is TRUE (correct)
) else (
    echo ❌ WARNING: KIOSK_MODE might be FALSE
    echo    Checking...
    findstr /C:"KIOSK_MODE" main-simple.js | findstr /C:"true"
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ CRITICAL: KIOSK_MODE = false
        echo.
        echo    The kiosk is in TESTING MODE!
        echo    This allows ALL keys to work!
        echo.
        echo    You MUST change line 153 to:
        echo    const KIOSK_MODE = true;
        echo.
        echo    Opening file in notepad...
        notepad main-simple.js
        pause
        exit /b 1
    )
)
echo.

echo [STEP 3/5] Checking if fixes are in the file...
echo ════════════════════════════════════════════════════════════════
findstr /C:"forceKioskLock" main-simple.js > nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ forceKioskLock function found (NEW VERSION)
) else (
    echo ❌ OLD VERSION - Missing forceKioskLock function!
    echo.
    echo    Your file is TOO OLD and doesn't have the fixes!
    echo    You need to copy the NEW main-simple.js file!
    echo.
    pause
    exit /b 1
)

findstr /C:"OS-level Escape blocked" main-simple.js > nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Escape blocking code found
) else (
    echo ❌ Missing Escape blocking code!
    pause
    exit /b 1
)
echo.

echo [STEP 4/5] Clearing any lingering processes...
echo ════════════════════════════════════════════════════════════════
timeout /t 3 /nobreak >nul
taskkill /F /IM electron.exe /T 2>nul
echo ✅ Clean slate ready
echo.

echo [STEP 5/5] Starting kiosk with FULL LOCKDOWN...
echo ════════════════════════════════════════════════════════════════
echo.
echo ⚠️  CRITICAL INSTRUCTIONS:
echo.
echo    1. When kiosk window appears, it should be FULLSCREEN
echo    2. Press ESC key - taskbar should NOT appear
echo    3. Press Windows key - Start menu should NOT open
echo    4. Press F12 - DevTools should NOT open
echo.
echo    If ANY of these work, the kiosk is NOT in lockdown mode!
echo.
echo Starting kiosk NOW...
echo.
start /MIN cmd /c "cd /d C:\StudentKiosk && npm start"
timeout /t 5 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════════════
echo ✅ KIOSK STARTED!
echo ════════════════════════════════════════════════════════════════
echo.
echo TEST IMMEDIATELY:
echo   1. Press Escape key 10 times → Should NOT show taskbar
echo   2. Press Windows key → Should NOT open Start menu
echo   3. Press F12 → Should NOT open DevTools
echo.
echo IF KEYS STILL WORK:
echo   The file you're running is NOT the updated version!
echo.
echo   Check console output for these messages:
echo   ✅ "OS-level Escape blocked"
echo   ✅ "FULL KIOSK MODE - All keyboard shortcuts blocked"
echo   ✅ "Blocked XX shortcuts including Escape and Windows key"
echo.
echo   If you DON'T see these messages, you're running the WRONG FILE!
echo.
echo ════════════════════════════════════════════════════════════════
pause
