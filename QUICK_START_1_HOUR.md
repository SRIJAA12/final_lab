# 🚀 QUICK START - Deploy in 1 Hour

## ⏱️ TIMELINE
- **Preparation:** 10 minutes
- **Admin System:** 20 minutes  
- **First Student System (test):** 10 minutes
- **Deploy to remaining 59 systems:** 20 minutes
- **Testing:** 10 minutes

---

## ✅ WHAT'S BEEN FIXED

### Critical Issues Resolved:
1. **✅ Kiosk Blinking** - No more flickering, completely blocks everything
2. **✅ VS Code Visible** - Window stays hidden until fully loaded
3. **✅ Database Sync** - Guide for centralized MongoDB setup
4. **✅ Deployment Structure** - Clear separation of admin/student systems

### You Must Rebuild the Kiosk EXE with these fixes!

---

## 📦 PREPARATION (10 min)

### 1. Rebuild Kiosk EXE with Fixes (On Your Laptop)

```powershell
# Open PowerShell in VS Code
cd student-kiosk\desktop-app

# Install dependencies (if not done)
npm install

# Build Windows EXE with fixes
npm run build-win
```

**Output Location:**
```
student-kiosk\desktop-app\dist\Student Lab Kiosk Setup 1.0.0.exe
```

### 2. Prepare USB Drive

Copy to USB:
```
✅ Student Lab Kiosk Setup 1.0.0.exe (built above)
✅ Entire project folder (as backup)
✅ Node.js installer: node-v18.xx.x-x64.msi
✅ MongoDB installer: mongodb-windows-x64-7.0.x.msi
✅ This guide (QUICK_START_1_HOUR.md)
```

### 3. Get Network Information

From IT department or router:
```
Network IP range: 192.168.x.x
Admin IP: 192.168.1.1 (or your choice)
Student IPs: 192.168.1.2 to 192.168.1.61
Gateway: 192.168.1.1
DNS: 8.8.8.8
```

---

## 💻 ADMIN SYSTEM SETUP (20 min)

### Step 1: Set Static IP (2 min)

1. **Windows Settings** → Network → Ethernet → Edit
2. **Manual IPv4:**
   ```
   IP: 192.168.1.1
   Subnet: 255.255.255.0
   Gateway: 192.168.1.1
   DNS: 8.8.8.8
   ```
3. Save and verify:
   ```powershell
   ipconfig
   # Should show 192.168.1.1
   ```

### Step 2: Install MongoDB (8 min)

1. **Run installer:** `mongodb-windows-x64-7.0.x.msi`
2. **Choose:** Complete installation
3. **Install as Service:** ✅ Yes
4. **Run as:** Network Service user
5. **Wait for installation...**

6. **Configure for network access:**
   ```powershell
   notepad "C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg"
   ```
   
   Change `bindIp`:
   ```yaml
   net:
     port: 27017
     bindIp: 0.0.0.0
   ```
   
   Save and close.

7. **Restart MongoDB:**
   ```powershell
   net stop MongoDB
   net start MongoDB
   ```

### Step 3: Install Node.js (2 min)

1. Run: `node-v18.xx.x-x64.msi`
2. Default installation
3. Verify:
   ```powershell
   node --version
   ```

### Step 4: Copy Project Files (2 min)

Copy entire project folder to:
```
D:\screen_mirror_deployment_my_laptop\
```

### Step 5: Configure Server (3 min)

```powershell
cd D:\screen_mirror_deployment_my_laptop\central-admin\server

# Install dependencies
npm install

# Create .env file
notepad .env
```

**Add to .env:**
```env
# For LOCAL MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/student_lab_system

# Server config
PORT=7401
HOST=0.0.0.0

# Email (change these!)
EMAIL_USER=your-college-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Lab System <your-college-email@gmail.com>

# Security
ADMIN_PASSWORD=admin123
BCRYPT_SALT_ROUNDS=10
```

Save and close.

### Step 6: Configure Firewall (2 min)

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Lab Server" dir=in action=allow protocol=TCP localport=7401
netsh advfirewall firewall add rule name="MongoDB" dir=in action=allow protocol=TCP localport=27017
netsh advfirewall firewall add rule name="WebRTC" dir=in action=allow protocol=UDP localport=10000-20000
```

### Step 7: Test Server (1 min)

```powershell
cd D:\screen_mirror_deployment_my_laptop\central-admin\server
node app.js
```

**Expected output:**
```
✅ MongoDB connected successfully
✅ Server running on port 7401
🌐 Admin Dashboard: http://192.168.1.1:7401/dashboard/admin-dashboard.html
```

**Keep this terminal open!**

### Step 8: Add Test Students (2 min)

Open in browser:
```
file:///D:/screen_mirror_deployment_my_laptop/student-management-system.html
```

Add 2-3 test students:
```
Name: Test Student 1
Student ID: TEST001
Email: test1@college.edu
Password: password123
DOB: 2000-01-01
Department: Computer Science
```

---

## 🖥️ FIRST STUDENT SYSTEM (10 min)

**Test on ONE system before deploying to all 60!**

### Step 1: Set Static IP (2 min)

```
IP: 192.168.1.2
Subnet: 255.255.255.0
Gateway: 192.168.1.1
DNS: 8.8.8.8
```

### Step 2: Test Connectivity (1 min)

```powershell
ping 192.168.1.1
# Should get replies

curl http://192.168.1.1:7401
# Should get HTTP response
```

### Step 3: Install Node.js (2 min)

Run `node-v18.xx.x-x64.msi` with defaults

### Step 4: Create server-config.json (1 min)

```powershell
notepad C:\Temp\server-config.json
```

Add:
```json
{
  "serverIp": "192.168.1.1",
  "serverPort": "7401",
  "lastUpdated": "2025-12-30T10:00:00.000Z",
  "autoDetect": false
}
```

Save.

### Step 5: Install Kiosk (2 min)

1. Copy `Student Lab Kiosk Setup 1.0.0.exe` to `C:\Temp\`
2. Run installer
3. Install to default location
4. **After install:** Copy `server-config.json` to:
   ```
   C:\Program Files\Student Lab Kiosk\resources\
   ```

### Step 6: Set System Number (1 min)

1. Right-click "This PC" → Properties
2. Advanced → Environment Variables
3. System variables → New
   ```
   Name: SYSTEM_NUMBER
   Value: PC-01
   ```
4. OK

### Step 7: Test! (1 min)

1. **Restart the system** (or manually run kiosk)
2. **Should see:**
   - Fullscreen kiosk login
   - No blinking
   - Desktop completely hidden
3. **Login with test student credentials**
4. **Check admin dashboard** - should see:
   - PC-01 session active
   - Live screen feed

**If this works, proceed to deploy to all systems!**

---

## 🚀 DEPLOY TO ALL 60 SYSTEMS (20 min)

### Option A: Manual (Tedious but Sure)

For each system (PC-02 to PC-60):
1. Set IP: `192.168.1.[2-61]`
2. Install Node.js
3. Run kiosk installer
4. Copy server-config.json
5. Set SYSTEM_NUMBER: `PC-02` to `PC-60`
6. Restart

### Option B: Semi-Automated (Faster)

**1. Create shared folder on admin system:**
```powershell
# On admin system
mkdir C:\LabInstall
copy "Student Lab Kiosk Setup 1.0.0.exe" C:\LabInstall\
copy server-config.json C:\LabInstall\
copy node-v18.xx.x-x64.msi C:\LabInstall\

# Share the folder
net share LabInstall=C:\LabInstall /grant:everyone,READ
```

**2. Create install script:**

Save as `C:\LabInstall\install-kiosk.bat`:
```batch
@echo off
echo Installing Lab Kiosk...

REM Install Node.js silently
\\192.168.1.1\LabInstall\node-v18.xx.x-x64.msi /quiet

REM Wait for Node.js install
timeout /t 30

REM Install Kiosk
\\192.168.1.1\LabInstall\Student Lab Kiosk Setup 1.0.0.exe /S

REM Wait for kiosk install
timeout /t 20

REM Copy config
mkdir "C:\Program Files\Student Lab Kiosk\resources\"
copy \\192.168.1.1\LabInstall\server-config.json "C:\Program Files\Student Lab Kiosk\resources\"

echo Installation complete!
echo Please set SYSTEM_NUMBER environment variable
pause
```

**3. On each student system:**
```powershell
# Run as Administrator
\\192.168.1.1\LabInstall\install-kiosk.bat

# Then manually set:
# - Static IP
# - SYSTEM_NUMBER variable
# - Restart
```

### Option C: PowerShell Remote (Advanced)

If Windows Remote Management is enabled:

```powershell
# On admin system
$systems = 2..61 | ForEach-Object { "192.168.1.$_" }

foreach ($ip in $systems) {
    $session = New-PSSession -ComputerName $ip
    Invoke-Command -Session $session -ScriptBlock {
        # Install commands here
    }
    Remove-PSSession $session
}
```

---

## ✅ TESTING (10 min)

### Test Checklist:

**Admin System:**
- [ ] Server running without errors
- [ ] MongoDB service running
- [ ] Dashboard accessible: `http://192.168.1.1:7401/dashboard/admin-dashboard.html`
- [ ] Student management working
- [ ] Can add/edit students

**Pick 5 Random Student Systems:**
- [ ] Kiosk auto-starts on boot
- [ ] Fullscreen, no blinking
- [ ] Can login with test credentials
- [ ] Appears on admin dashboard
- [ ] Screen mirroring works
- [ ] Can logout successfully

**Network:**
- [ ] All systems can ping admin (192.168.1.1)
- [ ] Admin can see all connected systems
- [ ] Screen mirroring smooth (not laggy)

### Load Test:

1. Have 10 students login simultaneously
2. Check admin dashboard
3. All 10 screens should appear
4. Try viewing multiple screens at once
5. Should be responsive

---

## 🎯 DAILY OPERATION

### Starting the System:

**Admin System:**
```powershell
# Double-click: START-LAB-SERVER.bat
# OR manually:
cd D:\screen_mirror_deployment_my_laptop\central-admin\server
node app.js
```

**Student Systems:**
- Auto-start on Windows login
- Students just login with credentials

### During Class:

**Admin can:**
- View any student's screen in real-time
- See who's logged in
- See time remaining
- Remote shutdown at end of class

### End of Day:

**Admin:**
- Use "Shutdown All" on dashboard
- OR: Press `Ctrl+C` in server terminal
- Students will be logged out

---

## 📋 COMPLETED SETUP CHECKLIST

### Pre-Deployment:
- [ ] Rebuilt kiosk EXE with fixes
- [ ] Tested on your laptop (no blinking)
- [ ] Prepared USB drive with all files
- [ ] Got network IP range from IT

### Admin System:
- [ ] Static IP: 192.168.1.1
- [ ] MongoDB installed and configured for network
- [ ] Node.js installed
- [ ] Server files copied
- [ ] .env file configured
- [ ] Firewall rules added
- [ ] Server tested and working
- [ ] Test students added
- [ ] Dashboard accessible

### First Student System (Test):
- [ ] Static IP: 192.168.1.2
- [ ] Node.js installed
- [ ] Kiosk installed
- [ ] server-config.json copied
- [ ] SYSTEM_NUMBER set to PC-01
- [ ] Tested login successfully
- [ ] Screen appears on dashboard
- [ ] No blinking or flickering

### All 60 Student Systems:
- [ ] All have static IPs (192.168.1.2-61)
- [ ] All have Node.js
- [ ] All have kiosk installed
- [ ] All have correct server-config.json
- [ ] Each has unique SYSTEM_NUMBER (PC-01 to PC-60)
- [ ] All tested and working
- [ ] Auto-start verified

### Final Verification:
- [ ] All 60 systems visible on dashboard
- [ ] Can view screens from any system
- [ ] Login/logout works on all systems
- [ ] Kiosk completely blocks desktop on all systems
- [ ] MongoDB syncing across all systems
- [ ] Performance is acceptable

---

## 🚨 IF SOMETHING GOES WRONG

### Kiosk Still Blinking?
→ Make sure you rebuilt with new code: `npm run build-win`
→ Check `KIOSK_MODE = true` in main-simple.js

### Can't Connect to Server?
→ Ping admin IP: `ping 192.168.1.1`
→ Check firewall: `netsh advfirewall show currentprofile`
→ Verify server running: Check admin system terminal

### Database Not Working?
→ Check MongoDB service: `Get-Service MongoDB`
→ Verify connection string in .env
→ Check mongod.cfg has `bindIp: 0.0.0.0`

### Need More Help?
→ See: TROUBLESHOOTING_GUIDE.md
→ Check logs in: `C:\Users\[User]\AppData\Roaming\Student Lab Kiosk\logs\`

---

## 🎉 SUCCESS!

You now have:
- ✅ 1 Admin system managing everything
- ✅ 60 Student systems in locked kiosk mode
- ✅ Real-time screen monitoring
- ✅ Centralized database
- ✅ Professional lab management system

**Next Steps:**
1. Train lab staff on using admin dashboard
2. Add real student data
3. Configure class schedules
4. Set up automatic reports

---

**Estimated Time:** 60 minutes  
**Difficulty:** Medium  
**Result:** Fully deployed 60-system lab!
