@echo off
echo ======================================================================
echo AUTO-START FEATURE - QUICK TEST CSV GENERATOR
echo ======================================================================
echo.
echo This will create a test timetable CSV that will auto-start IMMEDIATELY
echo when uploaded (scheduled for 5 minutes ago).
echo.

REM Get current time components
for /f "tokens=1-3 delims=:" %%a in ("%time%") do (
    set hour=%%a
    set minute=%%b
)

REM Remove leading spaces
set hour=%hour: =0%
set minute=%minute: =0%

REM Calculate 5 minutes ago
set /a oldminute=%minute%-5
set /a oldhour=%hour%

if %oldminute% LSS 0 (
    set /a oldminute=%oldminute%+60
    set /a oldhour=%oldhour%-1
)

if %oldhour% LSS 0 (
    set /a oldhour=%oldhour%+24
)

REM Format with leading zeros
if %oldhour% LSS 10 set oldhour=0%oldhour%
if %oldminute% LSS 10 set oldminute=0%oldminute%

REM Calculate 45 minutes later for end time
set /a endminute=%minute%+45
set /a endhour=%hour%

if %endminute% GEQ 60 (
    set /a endminute=%endminute%-60
    set /a endhour=%endhour%+1
)

if %endhour% GEQ 24 (
    set /a endhour=%endhour%-24
)

REM Format with leading zeros
if %endhour% LSS 10 set endhour=0%endhour%
if %endminute% LSS 10 set endminute=0%endminute%

REM Get current date (YYYY-MM-DD format)
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set dt=%%a
set year=%dt:~0,4%
set month=%dt:~4,2%
set day=%dt:~6,2%
set today=%year%-%month%-%day%

echo Creating test CSV file...
echo.
echo Session Date: %today%
echo Start Time: %oldhour%:%oldminute% (5 minutes ago)
echo End Time: %endhour%:%endminute% (45 minutes from now)
echo.

REM Create the CSV file
echo Session Date,Start Time,End Time,Faculty,Subject,Lab ID,Year,Department,Section,Periods,Duration > test_timetable_autostart.csv
echo %today%,%oldhour%:%oldminute%,%endhour%:%endminute%,Test Faculty,Auto-Start Test,CC1,2,Computer Science,A,1,50 >> test_timetable_autostart.csv

echo ======================================================================
echo ✅ TEST CSV CREATED: test_timetable_autostart.csv
echo ======================================================================
echo.
echo 📋 Content:
type test_timetable_autostart.csv
echo.
echo ======================================================================
echo 🎯 HOW TO TEST:
echo ======================================================================
echo 1. Open Admin Dashboard (http://YOUR_SERVER_IP:7401)
echo 2. Go to "Timetable Management" section
echo 3. Upload the file: test_timetable_autostart.csv
echo 4. Watch for auto-start notification within 3 seconds!
echo.
echo Expected result:
echo   ✅ Session should start IMMEDIATELY (uploaded late)
echo   ✅ Notification: "1 session(s) detected and auto-started"
echo   ✅ Console shows: "Session started 5 minutes late"
echo.
echo ======================================================================
echo.
pause
