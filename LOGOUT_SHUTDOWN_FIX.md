# Logout & Shutdown Flow - Fixed

## Problem
- Multiple dialog boxes appearing continuously when clicking logout
- Confusing error messages like "Logout failed: No active session"
- Dialog boxes showing repeatedly

## Solution Applied

### Changes Made:

#### 1. **student-interface.html** - Fixed logout function
- Added `isLoggingOut` flag to prevent duplicate logout calls
- Added call to `showShutdownDialog()` BEFORE logout to show single confirmation
- Only ONE dialog will show: "Session Ended - System Shutting Down" with 1 minute warning

#### 2. **main-simple.js** - Removed duplicate dialogs
- Modified `handleLogoutProcess()` to NOT show dialogs automatically
- Removed the multiple dialog boxes that were appearing after logout
- Shutdown command still executes silently in background (1 minute delay)

#### 3. **preload.js** - Added new API
- Added `showShutdownDialog()` function to expose dialog to renderer

## New Logout Flow

1. **User clicks "Logout" button**
2. **ONE dialog appears**: "Session Ended - System Shutting Down"
   - Message: "System will automatically shutdown in 1 minute (60 seconds)"
   - Detail: Asks user to save work
   - Has single "OK" button
3. **User clicks "OK"**
4. **Page reloads** → Returns to kiosk login screen
5. **System shutdown** → Scheduled for 1 minute, executes automatically

## Testing Steps

1. Start the kiosk application: `START-KIOSK.bat`
2. Login with a test student account
3. Click the "Logout" button
4. **Expected behavior:**
   - ONE dialog box appears with shutdown warning
   - Click OK
   - Screen returns to login page
   - System will shutdown in 1 minute (Windows shutdown command scheduled)
5. **What should NOT happen:**
   - No repeated dialogs
   - No "Logout failed: No active session" errors
   - No multiple confirmation boxes

## Files Modified

1. `student-kiosk/desktop-app/student-interface.html` - Lines 947-977
2. `student-kiosk/desktop-app/main-simple.js` - Lines 568-595, 768-787
3. `student-kiosk/desktop-app/preload.js` - Lines 41-42

## Technical Details

- Shutdown command: `shutdown /s /t 60` (60 seconds = 1 minute)
- Logout flag prevents duplicate calls during async operations
- Dialog is shown by main process (Electron) before logout begins
- Single responsibility: HTML shows dialog, main process handles logout & shutdown
