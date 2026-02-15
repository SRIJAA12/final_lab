# 🔌 Remote Shutdown - Quick Reference Card

## ✅ What's Been Implemented

### 1. Individual Shutdown Button
- **Location:** On each student card in admin dashboard
- **Button:** 🔌 Shutdown (red button next to Expand button)
- **Action:** Shuts down ONLY that specific student's computer

### 2. Shutdown All Button  
- **Location:** Control panel at top of admin dashboard
- **Button:** ⚠️ Shutdown All Lab Systems (orange button)
- **Action:** Shuts down ALL logged-in student computers

---

## 🚀 How to Use

### Individual Shutdown (One Student)
```
1. Open admin dashboard
2. Find the student card you want to shutdown
3. Click the "🔌 Shutdown" button
4. Confirm the action
5. Student sees 10-second countdown
6. Computer shuts down
```

### Bulk Shutdown (All Students)
```
1. Open admin dashboard
2. Click "⚠️ Shutdown All Lab Systems" at top
3. Confirm the action (double confirmation)
4. All students see 10-second countdowns
5. All computers shut down simultaneously
```

---

## 🎯 What Happens When You Click Shutdown?

### Student's View:
```
┌──────────────────────────────────────┐
│                                      │
│    ⚠️ SYSTEM SHUTDOWN                │
│                                      │
│  This computer is shutting down...   │
│                                      │
│            [ 10 ]                    │
│                                      │
│  Please save your work immediately!  │
│                                      │
│  Shutdown initiated by               │
│  Lab Administrator                   │
│                                      │
└──────────────────────────────────────┘
```

### Admin's View:
```
✅ Notification: "Shutdown command sent to CC1-12"
    
Student card shows: "🔌 Shutdown initiated..."
    
After shutdown: Student card disappears from grid
```

---

## 📋 IP Range Configuration

**Your Lab Network:**
- Student PCs: `10.10.46.12` to `10.10.46.255`
- Admin Server: `10.10.46.103` (excluded from shutdown)
- Total Systems: 243 possible student computers

**Visibility Rules:**
- ✅ Student logged in → Visible in dashboard → Can be shut down
- ❌ Kiosk at login screen → Not visible → Cannot be shut down
- ❌ Computer powered off → Not visible → Cannot be shut down

---

## 🛠️ Technical Details

### Windows Command Executed:
```powershell
shutdown /s /f /t 0
```
- `/s` = Shutdown (not restart)
- `/f` = Force close all applications
- `/t 0` = 0 second delay (immediate)

### Socket Events Used:
```javascript
// Admin → Server
'shutdown-system'         // Individual shutdown
'shutdown-all-systems'    // Bulk shutdown

// Server → Kiosk
'force-shutdown-system'   // With countdown & data

// Server → Admin
'shutdown-success'        // Confirmation
'shutdown-error'          // Error notification
```

---

## ✅ Safety Features

1. **Confirmation Dialogs**
   - Individual: 1 confirmation
   - Shutdown All: 2 confirmations

2. **Student Warning**
   - 10-second full-screen countdown
   - Clear visual indication
   - Time to save work

3. **Admin Authentication**
   - Only logged-in admins can shutdown
   - Session-based authentication
   - Daily rotating passwords

4. **Audit Trail**
   - All shutdowns logged in database
   - Includes: timestamp, system, admin
   - Can be reviewed in reports

---

## 🔍 Troubleshooting

### Shutdown Button Not Visible?
- ✅ Check: Is student actually logged in?
- ✅ Check: Refresh admin dashboard
- ✅ Check: Browser console for errors

### Shutdown Not Working?
- ✅ Check: Server is running
- ✅ Check: Network connectivity
- ✅ Check: Student system is connected (socket active)
- ✅ Check: Windows user has shutdown permissions

### Student Card Still Showing After Shutdown?
- ✅ Wait 30 seconds for session cleanup
- ✅ Refresh admin dashboard
- ✅ Check if computer actually powered off

---

## 📁 Files Modified

| File | Purpose | Status |
|------|---------|--------|
| `central-admin/server/app.js` | Shutdown socket events | ✅ Modified |
| `central-admin/dashboard/admin-dashboard.html` | Shutdown buttons & UI | ✅ Modified |
| `student-kiosk/student-interface.html` | Shutdown listener | ✅ Already Ready |
| `student-kiosk/preload.js` | IPC bridge | ✅ Already Ready |
| `student-kiosk/main-simple.js` | Windows command | ✅ Already Ready |

---

## 🎓 Common Scenarios

### Scenario 1: One Student Misbehaving
**Action:** Click individual shutdown button  
**Result:** Only that student shuts down  
**Others:** Continue working normally

### Scenario 2: Lab Session Ending
**Action:** Click "Shutdown All Lab Systems"  
**Result:** All students shut down cleanly  
**Benefit:** Fast lab cleanup

### Scenario 3: Emergency Situation
**Action:** Bulk shutdown for immediate control  
**Result:** Controlled shutdown of entire lab  
**Security:** Prevents further issues

---

## 📊 Testing Commands

### Start Server:
```powershell
cd central-admin/server
npm start
```

### Access Admin Dashboard:
```
http://10.10.46.103:7401/dashboard/admin-dashboard.html
```

### Login as Admin:
- Use daily password (check guest password panel)

### Test Individual Shutdown:
1. Have 1 student logged in
2. Click shutdown on their card
3. Verify countdown appears
4. Verify system shuts down

### Test Bulk Shutdown:
1. Have 3+ students logged in
2. Click "Shutdown All Lab Systems"
3. Verify all see countdowns
4. Verify all shut down

---

## 💡 Pro Tips

1. **Before Shutdown:** Announce to students over PA system

2. **Guest Mode:** Guest sessions can also be shut down

3. **Scheduled Shutdown:** Use "End Lab Session" first, then shutdown

4. **Power On:** Students must manually power on after shutdown (use WOL if configured)

5. **Batch Operations:** For specific groups, use individual shutdowns

---

## ✨ Summary

✅ Individual shutdown buttons on each student card  
✅ Bulk shutdown button for all systems  
✅ 10-second warning countdown for students  
✅ Complete Windows shutdown via command  
✅ Only logged-in students visible & shutdownable  
✅ Safety confirmations and audit logging  
✅ Works for IP range: 10.10.46.12-255  

**Status: Ready for Production Use!** 🎉

---

**Documentation Created:** February 15, 2026  
**Feature Version:** 1.0  
**Tested:** ✅ Individual & Bulk Shutdown  
