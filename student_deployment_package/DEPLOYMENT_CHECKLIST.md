# 🎯 COMPLETE DEPLOYMENT CHECKLIST

## BEFORE YOU START

### Server Requirements ✅
- [ ] Server PC running at **10.10.46.103:7401**
- [ ] MongoDB database running
- [ ] Node.js server started (`node app.js`)
- [ ] Students registered in database
- [ ] Admin dashboard accessible

---

## STUDENT SYSTEM DEPLOYMENT

### Step 1: UNINSTALL OLD KIOSK (If exists)
On each student PC where kiosk is already installed:

1. **Right-click** `UNINSTALL_KIOSK.bat` → **Run as Administrator**
2. Wait for uninstallation to complete
3. **Restart the PC** (IMPORTANT!)

---

### Step 2: VERIFY SERVER CONNECTION
Before installing, test if student PC can reach server:

1. Run `TEST_CONNECTION.bat`
2. Should show: "Server is reachable at 10.10.46.103:7401"
3. If fails, check network connection

---

### Step 3: INSTALL KIOSK

1. **Copy** entire `student_deployment_package` folder to USB drive

2. **On student PC:**
   - Copy folder to `C:\Temp\student_deployment_package`
   - **Right-click** `INSTALL_KIOSK.bat` → **Run as Administrator**

3. **Enter System Number:**
   ```
   Examples:
   - CC1-01  (Computer Center 1, System 1)
   - CC1-02  (Computer Center 1, System 2)
   - CC2-01  (Computer Center 2, System 1)
   ```

4. **Installation will:**
   - Copy files to `C:\StudentKiosk`
   - Install Node.js dependencies
   - Configure server connection (10.10.46.103:7401)
   - Set auto-start on Windows login
   - Create desktop shortcut

5. **Wait** until you see "Installation Complete"

---

### Step 4: RESTART & TEST

1. **Restart the student PC**

2. **After boot:**
   - Kiosk will auto-start in **FULL SCREEN**
   - Everything should be **BLOCKED**:
     - ❌ Alt+Tab blocked
     - ❌ Windows key blocked
     - ❌ Ctrl+Alt+Del blocked
     - ❌ Task Manager blocked
     - ❌ All shortcuts blocked
   - Login screen should appear

3. **Test Login:**
   - Enter student credentials
   - Should connect to server successfully
   - Timer window appears
   - Student can access allowed websites

4. **Test Logout:**
   - Click Logout button
   - Returns to locked login screen

---

## KIOSK FEATURES VERIFICATION

### ✅ Full Lockdown Mode
- [ ] Kiosk starts automatically on boot
- [ ] Full-screen mode (no taskbar visible)
- [ ] Cannot minimize or close
- [ ] Cannot Alt+Tab to other apps
- [ ] Cannot press Windows key
- [ ] Cannot access Task Manager
- [ ] Cannot use Ctrl+Alt+Del
- [ ] Student login screen shows immediately

### ✅ After Student Login
- [ ] Timer window appears
- [ ] Student can browse allowed sites
- [ ] Admin can see student status in dashboard
- [ ] Screen monitoring works
- [ ] System info displayed correctly

### ✅ After Student Logout
- [ ] Returns to locked login screen
- [ ] All blocking restored
- [ ] Timer window closes
- [ ] Ready for next student

---

## TROUBLESHOOTING

### Problem: "Connection Refused" Error
**Solution:**
1. Check server is running: http://10.10.46.103:7401
2. Check network: Run `ping 10.10.46.103`
3. Check server-config.json has correct IP

### Problem: Kiosk doesn't start on boot
**Solution:**
1. Check: `C:\StudentKiosk\Student Kiosk.exe` exists
2. Check startup: Win+R → `shell:startup`
3. Reinstall using `INSTALL_KIOSK.bat`

### Problem: Can still use Alt+Tab
**Solution:**
1. Kiosk not in full lockdown mode
2. Uninstall completely
3. Reinstall fresh
4. Restart PC

### Problem: Installation fails
**Solution:**
1. Run as Administrator
2. Check Node.js is installed (installer will install if missing)
3. Check antivirus isn't blocking
4. Check disk space available

---

## EMERGENCY: Remove Kiosk Lockdown

If you need to access the system urgently:

**Method 1: Safe Mode**
1. Restart PC
2. Press F8 repeatedly during boot
3. Select "Safe Mode"
4. Run UNINSTALL_KIOSK.bat

**Method 2: Task Manager**
1. Press Ctrl+Shift+Esc repeatedly
2. If Task Manager opens, End Task on "Student Kiosk"
3. Run UNINSTALL_KIOSK.bat

**Method 3: Boot from USB**
1. Boot from USB drive
2. Navigate to C:\StudentKiosk
3. Delete the folder

---

## DEPLOYMENT CHECKLIST (Per System)

```
System: CC1-__

[ ] Old kiosk uninstalled (if exists)
[ ] System restarted after uninstall
[ ] Server connection tested (TEST_CONNECTION.bat)
[ ] New kiosk installed (INSTALL_KIOSK.bat)
[ ] System number set correctly
[ ] Installation completed without errors
[ ] System restarted after install
[ ] Kiosk auto-started on boot
[ ] Full lockdown verified (Alt+Tab blocked)
[ ] Login screen appears
[ ] Test login successful
[ ] Timer window appears
[ ] Test logout successful
[ ] Returns to locked screen

Deployed by: __________
Date: __________
Time: __________
Notes: _________________________
```

---

## QUICK REFERENCE

**Server IP:** 10.10.46.103:7401

**Installation Location:** C:\StudentKiosk

**Config File:** C:\StudentKiosk\resources\server-config.json

**Logs:** C:\StudentKiosk\logs

**Uninstall:** Run UNINSTALL_KIOSK.bat as Administrator

**Test Connection:** Run TEST_CONNECTION.bat

---

## SUPPORT CONTACTS

If you encounter issues during deployment, contact:
- IT Support: [Your contact]
- System Admin: [Your contact]

---

**Last Updated:** January 8, 2026
**Version:** 1.0
