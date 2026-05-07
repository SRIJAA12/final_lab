# 🎯 STUDENT SYSTEM DEPLOYMENT - STEP BY STEP

## ✅ WHAT YOU HAVE
- **Your Laptop (Development)**: 10.10.192.97
- **Admin System (Lab Server)**: 10.10.46.103
- **Student Systems**: Will connect to admin at 10.10.46.103

---

## 📦 STEP 1: PREPARE USB DRIVE (Do this on your laptop NOW)

1. **Copy the entire deployment package to USB:**
   ```cmd
   xcopy "d:\screen_mirror_deployment\student_deployment_package\*" "E:\student_kiosk\" /E /I /H
   ```
   *(Replace E: with your actual USB drive letter)*

2. **Also copy Node.js installer to USB:**
   - Download from: https://nodejs.org/
   - Save as: `E:\node-setup.msi`

---

## 🖥️ STEP 2: ON EACH STUDENT SYSTEM

### A. Install Node.js (If not already installed)

1. **Plug in USB drive**
2. **Run Node.js installer:**
   ```cmd
   E:\node-setup.msi
   ```
3. **Use all default options**, click Next → Next → Install
4. **Open NEW Command Prompt** (important!)
5. **Verify installation:**
   ```cmd
   node --version
   npm --version
   ```
   Should show v18+ and v9+

### B. Copy and Install Student Kiosk

1. **Copy files from USB to student PC:**
   ```cmd
   xcopy "E:\student_kiosk\*" "C:\Temp\student_kiosk\" /E /I /H
   ```

2. **Run the installation:**
   ```cmd
   cd C:\Temp\student_kiosk
   INSTALL_KIOSK.bat
   ```

3. **Wait for installation to complete** (may take 5-10 minutes for npm install)

### C. Set System Number

1. **Right-click "This PC"** → Properties
2. **Advanced system settings** → Environment Variables
3. **Under "System variables"**, click **New**
4. **Set:**
   - Variable name: `SYSTEM_NUMBER`
   - Variable value: `PC-01` (or PC-02, PC-03, etc.)
5. **Click OK** on all dialogs

### D. Test Before Restart

1. **Test connection to admin server:**
   ```cmd
   C:\Temp\student_kiosk\TEST_CONNECTION.bat
   ```
   
   **Should show:** `TcpTestSucceeded : True`
   
   **If False:**
   - Make sure admin server at 10.10.46.103 is running
   - Check both systems are on same network
   - Ping: `ping 10.10.46.103`

2. **Manual test (optional):**
   ```cmd
   cd C:\StudentKiosk
   npm start
   ```
   
   Kiosk should open fullscreen. Press `Alt+F4` to close.

### E. Restart and Verify

1. **Restart the computer:**
   ```cmd
   shutdown /r /t 0
   ```

2. **After restart:**
   - Kiosk should auto-start in fullscreen
   - Login screen should appear
   - No taskbar visible

---

## 🔍 VERIFICATION CHECKLIST

On each student system, verify:

- [ ] Node.js installed: `node --version`
- [ ] Files in: `C:\StudentKiosk`
- [ ] Config file has admin IP: `type C:\StudentKiosk\server-config.json`
- [ ] SYSTEM_NUMBER set: `echo %SYSTEM_NUMBER%`
- [ ] Can ping admin: `ping 10.10.46.103`
- [ ] Desktop shortcut exists: "Student Kiosk"
- [ ] Auto-starts after restart

---

## 🐛 TROUBLESHOOTING

### Issue: npm not found
**Fix:** Restart Command Prompt after installing Node.js

### Issue: Can't connect to server
**Fix:** 
```cmd
ping 10.10.46.103
```
If ping fails, check network connection

### Issue: Port 7401 blocked
**Fix:** Test with `TEST_CONNECTION.bat`

### Issue: Kiosk doesn't auto-start
**Fix:** 
```cmd
reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run" /v StudentKiosk
```
Should show: `C:\StudentKiosk\START_KIOSK.bat`

---

## 📝 QUICK COMMANDS

**Test connection:**
```cmd
C:\Temp\student_kiosk\TEST_CONNECTION.bat
```

**Start kiosk manually:**
```cmd
cd C:\StudentKiosk
npm start
```

**Check config:**
```cmd
type C:\StudentKiosk\server-config.json
```

**Check system number:**
```cmd
echo %SYSTEM_NUMBER%
```

---

## 🎯 SUMMARY

1. **USB contains:** student-kiosk folder + server-config.json + installers
2. **Each student PC needs:** Node.js + Kiosk files + SYSTEM_NUMBER variable
3. **Server IP:** 10.10.46.103:7401 (configured automatically)
4. **Auto-starts:** After restart, kiosk launches automatically

---

**Ready to deploy? Start with ONE student system first to test!**
