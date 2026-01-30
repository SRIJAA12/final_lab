@echo off
title Diagnose Forgot Password Issue
color 0E
echo ════════════════════════════════════════════════════════════════
echo          DIAGNOSE FORGOT PASSWORD / FIRST-TIME SIGNIN
echo ════════════════════════════════════════════════════════════════
echo.
echo This will help diagnose why forgot password is not working.
echo.

set /p STUDENT_ID="Enter Student ID (Roll Number): "
set /p EMAIL="Enter Email Address: "

echo.
echo ════════════════════════════════════════════════════════════════
echo Checking student data in database...
echo ════════════════════════════════════════════════════════════════
echo.

REM Query the database via server endpoint
curl -X POST http://localhost:7401/api/check-student-exists ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\":\"%STUDENT_ID%\",\"email\":\"%EMAIL%\"}"

echo.
echo.
echo ════════════════════════════════════════════════════════════════
echo Common Issues:
echo ════════════════════════════════════════════════════════════════
echo.
echo 1. Email Mismatch
echo    - Check if email in database matches exactly
echo    - Email is case-insensitive but must match
echo.
echo 2. Student ID Mismatch
echo    - Student ID is converted to UPPERCASE
echo    - Make sure it exists in database
echo.
echo 3. Student Not Added Yet
echo    - Student must be added via admin panel first
echo    - Check admin dashboard → Student Management
echo.
echo 4. Database Connection Issue
echo    - Make sure admin server is running
echo    - Check MongoDB connection
echo.
pause
