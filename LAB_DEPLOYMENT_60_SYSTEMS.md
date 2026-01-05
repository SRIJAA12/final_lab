# 🎓 COMPLETE LAB DEPLOYMENT GUIDE - 60 Student Systems + 1 Admin

## 📋 OVERVIEW

**What You're Building:**
- **61 Total Systems**: 1 Admin + 60 Student PCs
- **Network**: Static IPs (e.g., 192.168.1.1 to 192.168.1.61)
- **Admin System**: Runs server + MongoDB + Dashboard
- **Student Systems**: Run locked kiosk app only

---

## 🚀 PART 1: BEFORE YOU START

### What You Need:

1. ✅ Admin system with good specs (will host server + database)
2. ✅ All 60 student systems on same network
3. ✅ USB drive with:
   - Complete project folder
   - Node.js installer (v18+): https://nodejs.org/
   - MongoDB installer: https://www.mongodb.com/try/download/community
4. ✅ Network details:
   - Network IP range (e.g., 192.168.1.x or 10.10.46.x)
   - Admin IP (e.g., 192.168.1.1)
   - Student IPs (e.g., 192.168.1.2 to 192.168.1.61)

---

## 💻 PART 2: ADMIN SYSTEM SETUP

### Step 1: Set Static IP for Admin System

1. Open Settings → Network & Internet → Ethernet/Wi-Fi → Change adapter options
2. Right-click adapter → Properties
3. Select "Internet Protocol Version 4 (TCP/IPv4)" → Properties
4. Configure:
   ```
   ✅ IP address: 192.168.1.1
   ✅ Subnet mask: 255.255.255.0
   ✅ Default gateway: 192.168.1.1 (or your router IP)
   ✅ DNS: 8.8.8.8
   ```
5. Save and verify:
   ```powershell
   ipconfig
   # Should show: IPv4 Address: 192.168.1.1
   ```

### Step 2: Install MongoDB on Admin System

1. **Download MongoDB Community Server** (v7.0+)
2. Run installer:
   - ✅ Choose "Complete" installation
   - ✅ Install MongoDB as a Service
   - ✅ Run service as "Network Service user"
   - ✅ Data Directory: `C:\Program Files\MongoDB\Server\7.0\data`
   - ✅ Log Directory: `C:\Program Files\MongoDB\Server\7.0\log`
3. Install MongoDB Compass (optional, for GUI)
4. Verify MongoDB is running:
   ```powershell
   # Check if MongoDB service is running
   Get-Service MongoDB
   # Status should be "Running"
   ```

### Step 3: Configure MongoDB for Network Access

1. Open MongoDB config file:
   ```
   C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg
   ```
2. Edit the `bindIp` setting:
   ```yaml
   net:
     port: 27017
     bindIp: 0.0.0.0  # Allow connections from any IP
   ```
3. Restart MongoDB service:
   ```powershell
   net stop MongoDB
   net start MongoDB
   ```
4. Test connection:
   ```powershell
   # Option 1: Simple connection test using PowerShell (try this first)
   Test-NetConnection -ComputerName 192.168.1.1 -Port 27017
   # Should show: TcpTestSucceeded : True
   
   # Option 2: Use mongosh (MongoDB Shell - for v5.0+)
   # Note: Use & operator for paths with spaces in PowerShell
   & "C:\Program Files\MongoDB\Server\8.2\bin\mongosh.exe" --host 192.168.1.1 --port 27017
   
   # Option 3: Or add to PATH and use directly
   mongosh --host 192.168.1.1 --port 27017
   ```
   
   **⚠️ If TcpTestSucceeded is False, troubleshoot:**
   
   ```powershell
   # A. Check if MongoDB service is actually running
   Get-Service MongoDB
   # Status should be "Running" - if not, start it:
   Start-Service MongoDB
   
   # B. Verify MongoDB config file has correct bindIp
   notepad "C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg"
   # Ensure it shows: bindIp: 0.0.0.0
   
   # C. Check if Windows Firewall is blocking (run as Administrator)
   Get-NetFirewallRule -DisplayName "*MongoDB*"
   # If no rules found, add them:
   netsh advfirewall firewall add rule name="MongoDB Port 27017" dir=in action=allow protocol=TCP localport=27017
   
   # D. After making changes, restart MongoDB
   Restart-Service MongoDB
   
   # E. Test again
   Test-NetConnection -ComputerName 192.168.1.1 -Port 27017
   ```

### Step 4: Install Node.js on Admin System

1. Download from https://nodejs.org/ (LTS version)
2. Install with default options
3. Verify:
   ```powershell
   node --version  # Should show v18+
   npm --version   # Should show v9+
   ```

### Step 5: Setup Server Files on Admin System

1. Copy your entire project folder to admin system:
   ```
   D:\screen_mirror_deployment_my_laptop\
   ```

2. Navigate to server folder:
   ```powershell
   cd D:\screen_mirror_deployment_my_laptop\central-admin\server
   ```

3. Install dependencies:
   ```powershell
   npm install
   ```

4. Create/edit `.env` file in server folder:
   ```env
   # MongoDB Connection
   MONGO_URI=mongodb://127.0.0.1:27017/student_lab_system
   
   # Server Configuration
   PORT=7401
   HOST=0.0.0.0
   
   # Email Configuration (for password reset)
   EMAIL_USER=your-college-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Lab Management System <your-college-email@gmail.com>
   
   # Default Admin Password
   ADMIN_PASSWORD=admin123
   ```

5. Test server startup:
   ```powershell
   node app.js
   ```
   
   You should see:
   ```
   ✅ MongoDB connected successfully
   ✅ Server running on port 7401
   🌐 Admin Dashboard: http://192.168.1.1:7401/dashboard/admin-dashboard.html
   ```

### Step 6: Setup Admin Dashboard Access

1. **Open student-management-system.html on admin system**
   - Location: `D:\screen_mirror_deployment_my_laptop\student-management-system.html`
   - Update the server URL in the file (line 300-ish):
     ```javascript
     const API_URL = 'http://192.168.1.1:7401';
     ```

2. **Bookmark these URLs on admin system browser:**
   - Student Management: `file:///D:/screen_mirror_deployment_my_laptop/student-management-system.html`
   - Admin Dashboard: `http://192.168.1.1:7401/dashboard/admin-dashboard.html`
   - Server Status: `http://192.168.1.1:7401/`

### Step 7: Configure Firewall on Admin System

**Allow incoming connections for Node.js:**

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Lab Server Port 7401" dir=in action=allow protocol=TCP localport=7401
netsh advfirewall firewall add rule name="MongoDB Port 27017" dir=in action=allow protocol=TCP localport=27017
```

### Step 8: Test Admin System

1. Start the server:
   ```powershell
   cd D:\screen_mirror_deployment_my_laptop\central-admin\server
   node app.js
   ```

2. From ANOTHER computer on the network, try accessing:
   ```
   http://192.168.1.1:7401
   ```
   You should see the server status page.

3. Add test students using student-management-system.html

---

## 🖥️ PART 3: STUDENT SYSTEM SETUP (All 60 Systems)

### Step 1: Set Static IPs for Each Student System

**For System 1 (192.168.1.2):**
1. Network settings → Change adapter → Properties
2. IPv4 Properties:
   ```
   IP: 192.168.1.2
   Subnet: 255.255.255.0
   Gateway: 192.168.1.1
   DNS: 8.8.8.8
   ```

**For System 2 (192.168.1.3):**
   ```
   IP: 192.168.1.3
   (same subnet, gateway, DNS)
   ```

**Continue for all 60 systems** (192.168.1.2 to 192.168.1.61)

### Step 2: Install Node.js on ALL Student Systems

**Option A: Manual Installation**
1. Copy Node.js installer to each system
2. Install with default options

**Option B: Network Installation (Faster)**
1. Share Node.js installer from admin system
2. Run silent install on all systems:
   ```powershell
   \\192.168.1.1\shared\node-v18.x.x-x64.msi /quiet
   ```

### Step 3: Build Kiosk EXE (One Time on Your Laptop)

1. On YOUR laptop (where VS Code is), navigate to kiosk folder:
   ```powershell
   cd D:\screen_mirror_deployment_my_laptop\student-kiosk\desktop-app
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Build Windows EXE:
   ```powershell
   npm run build-win
   ```

4. Find the built EXE:
   ```
   D:\screen_mirror_deployment_my_laptop\student-kiosk\desktop-app\dist\Student Lab Kiosk Setup 1.0.0.exe
   ```

5. Copy this EXE to USB drive

### Step 4: Create Server Config File

**On admin system**, create this file:
```
D:\screen_mirror_deployment_my_laptop\server-config.json
```

Content:
```json
{
  "serverIp": "192.168.1.1",
  "serverPort": "7401",
  "lastUpdated": "2025-12-30T10:00:00.000Z",
  "autoDetect": false
}
```

### Step 5: Deploy Kiosk to Student Systems

**For EACH of the 60 student systems:**

1. **Copy files to student system:**
   - Copy `Student Lab Kiosk Setup 1.0.0.exe` to `C:\Temp\`
   - Copy `server-config.json` to `C:\Temp\`

2. **Run installer:**
   ```powershell
   C:\Temp\Student Lab Kiosk Setup 1.0.0.exe
   ```
   
   - Installer will:
     - Install to `C:\Program Files\Student Lab Kiosk\`
     - Create desktop shortcut
     - Add to startup registry
     - Copy server-config.json to install directory

3. **Configure system-specific settings:**
   
   After installation, edit:
   ```
   C:\Program Files\Student Lab Kiosk\resources\server-config.json
   ```
   
   Make sure it has:
   ```json
   {
     "serverIp": "192.168.1.1",
     "serverPort": "7401",
     "lastUpdated": "2025-12-30T10:00:00.000Z",
     "autoDetect": false
   }
   ```

4. **Set environment variable for system number:**
   
   Right-click "This PC" → Properties → Advanced system settings → Environment Variables
   
   Add new SYSTEM variable:
   ```
   Variable: SYSTEM_NUMBER
   Value: PC-01  (for first system)
          PC-02  (for second system)
          ...
          PC-60  (for 60th system)
   ```

5. **Restart the student system**

### Step 6: Verify Student System

After restart:
1. Kiosk app should auto-start
2. Full screen, no taskbar visible
3. Login screen should appear
4. Check on admin dashboard - system should appear as "Waiting for login"

---

## 🔧 PART 4: TESTING THE COMPLETE SYSTEM

### Test 1: Student Login (On any student PC)

1. Kiosk should be locked in fullscreen
2. Enter student credentials
3. After login:
   - Session should start
   - Screen sharing should activate
   - Admin should see live screen on dashboard

### Test 2: Admin Dashboard (On admin system)

1. Open: `http://192.168.1.1:7401/dashboard/admin-dashboard.html`
2. You should see all active student sessions
3. Click on any session to view screen
4. Try remote shutdown

### Test 3: Add New Student (On admin system)

1. Open: `student-management-system.html`
2. Add new student details
3. Go to any student PC, try logging in with new credentials
4. Should work immediately (database is centralized)

---

## 📝 PART 5: DAILY OPERATIONS

### Starting the System Each Day:

**On Admin System:**
```powershell
# 1. Verify MongoDB is running
Get-Service MongoDB

# 2. Start the server
cd D:\screen_mirror_deployment_my_laptop\central-admin\server
node app.js

# 3. Keep this terminal open while lab is in use
```

**On Student Systems:**
- Nothing needed! Kiosk auto-starts on Windows login
- Students just log in with their credentials

### Stopping the System:

**On Admin System:**
```powershell
# Press Ctrl+C in the server terminal
```

**On Student Systems:**
- Admin can use remote shutdown from dashboard
- OR physically restart the systems

---

## 🐛 TROUBLESHOOTING

### Issue: Student system can't connect to server

**Check:**
1. Admin system IP: `ipconfig` on admin system
2. Ping test from student: `ping 192.168.1.1`
3. Firewall on admin system
4. Server is running on admin system

### Issue: Database changes not reflecting

**Check:**
1. MongoDB is running: `Get-Service MongoDB`
2. Server is connected to MongoDB (check server terminal)
3. All systems pointing to same server IP (192.168.1.1)

### Issue: Kiosk blinking or VS Code visible

**This is fixed in the code update below!**

### Issue: Screen sharing not working

**Check:**
1. Student has logged in (screen share only works after login)
2. Network connection between student and admin
3. WebRTC ports not blocked by firewall

---

## 📊 QUICK REFERENCE

| Component | Location | Purpose |
|-----------|----------|---------|
| Admin System | 192.168.1.1 | Hosts server, MongoDB, dashboard |
| Student Systems | 192.168.1.2-61 | Run kiosk app only |
| MongoDB | Admin:27017 | Centralized database |
| Server | Admin:7401 | API and WebRTC signaling |
| Dashboard | http://192.168.1.1:7401/dashboard/ | Monitor all systems |
| Student Management | student-management-system.html | Add/edit students |

---

## 🔐 SECURITY NOTES

1. **Admin System:**
   - Keep physically secure
   - Strong password for Windows account
   - MongoDB should only be accessible on local network

2. **Student Systems:**
   - Locked in kiosk mode
   - No access to Windows until logged in
   - Auto-restart kiosk if closed

3. **Network:**
   - Consider isolating lab network from internet if not needed
   - Use strong WiFi password if using wireless

---

## ✅ FINAL CHECKLIST

**Admin System:**
- [ ] Static IP set (192.168.1.1)
- [ ] MongoDB installed and running
- [ ] Node.js installed
- [ ] Server files copied and dependencies installed
- [ ] Server starts successfully
- [ ] Firewall ports opened (7401, 27017)
- [ ] student-management-system.html accessible
- [ ] Admin dashboard accessible

**Each Student System (x60):**
- [ ] Static IP set (192.168.1.2 to 192.168.1.61)
- [ ] Node.js installed
- [ ] Kiosk EXE installed
- [ ] server-config.json pointing to 192.168.1.1
- [ ] SYSTEM_NUMBER environment variable set
- [ ] Auto-start enabled
- [ ] Tested login and screen sharing

**Network:**
- [ ] All systems can ping admin (192.168.1.1)
- [ ] All systems can access http://192.168.1.1:7401

---

## 🚀 AUTOMATION TIPS

### Create a PowerShell Script for Server Startup

Save as `start-lab-server.ps1` on admin system:

```powershell
# Start MongoDB if not running
$mongoService = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongoService.Status -ne 'Running') {
    Start-Service MongoDB
    Write-Host "✅ MongoDB started"
}

# Navigate to server directory
Set-Location "D:\screen_mirror_deployment_my_laptop\central-admin\server"

# Start server
Write-Host "🚀 Starting Lab Server..."
Write-Host "📊 Dashboard: http://192.168.1.1:7401/dashboard/admin-dashboard.html"
Write-Host "Press Ctrl+C to stop"
node app.js
```

Run daily:
```powershell
powershell -ExecutionPolicy Bypass -File "D:\start-lab-server.ps1"
```

---

**Need help? Check the specific error messages and refer back to this guide!**
