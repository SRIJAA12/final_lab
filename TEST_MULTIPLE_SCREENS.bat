@echo off
echo ===============================================================================
echo MULTIPLE SCREEN MIRRORING - TESTING GUIDE
echo ===============================================================================
echo.
echo This guide will help you verify that all student screens appear simultaneously
echo in the admin dashboard.
echo.
echo ===============================================================================
echo STEP 1: START THE SERVER
echo ===============================================================================
echo.
echo 1. Make sure the server is running:
echo    cd central-admin\server
echo    node app.js
echo.
echo 2. Wait for message: "Server running on http://YOUR_IP:7401"
echo.
pause
cls

echo ===============================================================================
echo STEP 2: OPEN ADMIN DASHBOARD
echo ===============================================================================
echo.
echo 1. Open browser and go to: http://YOUR_SERVER_IP:7401
echo 2. Click "Start Lab Session"
echo 3. Fill in session details and start
echo.
echo Expected: Session should start successfully
echo.
pause
cls

echo ===============================================================================
echo STEP 3: LOGIN MULTIPLE STUDENTS
echo ===============================================================================
echo.
echo Now have students login from different kiosk systems:
echo.
echo Student 1: Login from System 1
echo   Expected: Screen appears in admin grid, video starts automatically
echo.
echo Student 2: Login from System 2
echo   Expected: BOTH screens visible, Student 1 still connected
echo.
echo Student 3: Login from System 3
echo   Expected: ALL THREE screens visible and streaming
echo.
echo Continue logging in more students...
echo   Expected: ALL screens remain visible, no disconnections
echo.
pause
cls

echo ===============================================================================
echo STEP 4: VERIFY IN BROWSER CONSOLE
echo ===============================================================================
echo.
echo 1. Open browser DevTools (F12)
echo 2. Go to Console tab
echo 3. Look for health check logs (every 15 seconds):
echo.
echo    === CONNECTION HEALTH CHECK ===
echo    Total students: 5
echo    Total peer connections: 5
echo    Session abc123...: connected / connected / Video: OK
echo    Session def456...: connected / connected / Video: OK
echo    Summary: 5 connected, 0 connecting, 0 failed, 0 disconnected
echo    === END HEALTH CHECK ===
echo.
echo Expected: All connections should show "connected" state
echo.
pause
cls

echo ===============================================================================
echo STEP 5: CHECK VISUAL INDICATORS
echo ===============================================================================
echo.
echo In the admin dashboard, verify:
echo.
echo   [ ] All student cards are visible in the grid
echo   [ ] All video containers show live video streams
echo   [ ] Connection status shows "Connected" (green)
echo   [ ] No cards stuck at "Connecting..."
echo   [ ] Stats show correct number of students
echo.
pause
cls

echo ===============================================================================
echo STEP 6: TEST STABILITY
echo ===============================================================================
echo.
echo 1. Wait 30 seconds - all screens should remain stable
echo 2. Refresh page (F5) - all screens should reconnect
echo 3. Login another student - existing screens should NOT disconnect
echo 4. Have a student logout - their screen should disappear, others stay
echo.
echo Expected: System remains stable under all conditions
echo.
pause
cls

echo ===============================================================================
echo VERIFICATION CHECKLIST
echo ===============================================================================
echo.
echo Check each item:
echo.
echo [ ] Multiple students can login simultaneously
echo [ ] All screens visible in grid at same time
echo [ ] Video streams are working (not frozen)
echo [ ] Connection status shows "Connected" for all
echo [ ] Browser console shows no errors
echo [ ] Health check shows "X connected, 0 failed"
echo [ ] New students don't disconnect existing ones
echo [ ] Page refresh maintains all connections
echo [ ] Stats counter matches actual student count
echo [ ] Grid auto-updates when new students login
echo.
pause
cls

echo ===============================================================================
echo TROUBLESHOOTING
echo ===============================================================================
echo.
echo If screens are not showing:
echo.
echo PROBLEM: "Only one screen visible"
echo   - Check browser console for errors
echo   - Wait 15 seconds for health check to restart connections
echo   - Check network connectivity between admin and kiosks
echo.
echo PROBLEM: "Stuck at 'Connecting...'"
echo   - Check if kiosk is sending video (check kiosk console)
echo   - Check firewall settings (WebRTC needs open ports)
echo   - Try restarting the specific kiosk
echo.
echo PROBLEM: "Screens disappear on refresh"
echo   - Should auto-reconnect within 2-3 seconds
echo   - Check console logs for connection restoration
echo   - Check if students are still logged in
echo.
echo PROBLEM: "Connection state shows 'failed'"
echo   - Health monitor will auto-restart in 15 seconds
echo   - If persists, check network/firewall
echo   - May need TURN server for NAT traversal
echo.
pause
cls

echo ===============================================================================
echo SUCCESS INDICATORS
echo ===============================================================================
echo.
echo You will know it's working when:
echo.
echo   OK  All student screens appear in grid
echo   OK  Video streams are live (not frozen)
echo   OK  Console shows "connected / connected" for all sessions
echo   OK  Health check shows "X connected, 0 failed"
echo   OK  New students don't affect existing connections
echo   OK  Page refresh maintains all screens
echo   OK  No JavaScript errors in console
echo.
echo ===============================================================================
echo.
echo If all checks pass, the fix is working correctly!
echo All 60 students' screens should now be visible simultaneously!
echo.
echo ===============================================================================
pause
