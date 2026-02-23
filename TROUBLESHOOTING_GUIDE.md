# 🔧 Kiosk Not Starting - Troubleshooting Guide

## Quick Diagnostic Steps

### Step 1: Run Diagnostic Tool
```batch
Right-click DIAGNOSE_KIOSK.bat → Run as administrator
```
This will check:
- ✅ Admin rights
- ✅ Node.js installation
- ✅ Critical files
- ✅ Dependencies
- ✅ Server connectivity

---

## Common Issues & Solutions

### ❌ Issue 1: "Node.js not found"
**Symptom:** Error says `node is not recognized`

**Solution:**
```batch
# Install Node.js from: https://nodejs.org/
# Download "LTS" version
# During installation, check "Add to PATH"
# Restart Command Prompt after installation
```

**Verify:**
```batch
node --version
npm --version
```

---

### ❌ Issue 2: "npm install fails"
**Symptom:** Errors during `npm install`

**Solution A: Clean Install**
```batch
Right-click FIX_KIOSK.bat → Run as administrator
```

**Solution B: Manual Fix**
```batch
cd D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
```

---

### ❌ Issue 3: "Cannot connect to server"
**Symptom:** Kiosk starts but shows connection errors

**Check Server:**
```batch
# Is the server running?
# On server machine:
cd D:\SDC_Lab_monitoing_system\backend
npm start

# Should show: Server running on port 5003
```

**Check Server IP:**
```javascript
// In main-simple.js (line ~30)
const SERVER_URL = 'http://192.168.1.100:5003';  // ← Check this IP!
```

**Test Connection:**
```batch
ping 192.168.1.100
# Should reply without timeout

# Test port
powershell "Test-NetConnection -ComputerName 192.168.1.100 -Port 5003"
# Should show TcpTestSucceeded: True
```

**Fix Firewall:**
```batch
# On server machine, allow port 5003:
netsh advfirewall firewall add rule name="Lab Server" dir=in action=allow protocol=TCP localport=5003
```

---

### ❌ Issue 4: "Kiosk starts then crashes immediately"
**Symptom:** Black window appears and closes

**Check for Errors:**
```batch
# Run from Command Prompt to see errors:
cd D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk
npm start

# Read the error messages
```

**Common Causes:**
1. **Missing files:** Check all files exist
2. **Port conflict:** Another app using Electron
3. **Corrupted installation:** Run FIX_KIOSK.bat

---

### ❌ Issue 5: "White/blank screen"
**Symptom:** Kiosk opens but shows white screen

**Solution:**
```batch
# Press F12 to open DevTools
# Check "Console" tab for errors
# Check "Network" tab for failed requests
```

**Common Fixes:**
- Server not running → Start server
- Wrong SERVER_URL → Fix IP in main-simple.js
- CORS issues → Check server allows connections

---

### ❌ Issue 6: "System number not showing correctly"
**Symptom:** Shows "CC1-01" on all systems

**Fix:**
```javascript
// Edit main-simple.js (line ~50)
const SYSTEM_NUMBER = 'CC1-01';  // ← Change to CC1-02, CC1-03, etc.
```

**Or use automated script:**
```powershell
# SET_SYSTEM_NUMBER.ps1
.\SET_SYSTEM_NUMBER.ps1 -SystemNumber 5  # For CC1-05
```

---

### ❌ Issue 7: "Permission denied errors"
**Symptom:** Errors about file access or permissions

**Solution:**
```batch
# Always run as Administrator:
Right-click START_WITH_ADMIN.bat → Run as administrator
```

---

### ❌ Issue 8: "Electron app won't close"
**Symptom:** Kiosk stuck, can't close

**Force Close:**
```batch
# Method 1: Task Manager
Ctrl+Shift+Esc → Find "Electron" → End Task

# Method 2: Command
taskkill /F /IM electron.exe
```

---

## Step-by-Step Fresh Install

If nothing works, do a complete fresh install:

### 1. Clean Old Installation
```batch
cd D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk
rmdir /s /q node_modules
del package-lock.json
```

### 2. Verify Node.js
```batch
node --version
# Should show: v18.x.x or v20.x.x

npm --version
# Should show: 9.x.x or 10.x.x
```

### 3. Install Dependencies
```batch
npm install
```

### 4. Verify Installation
```batch
# Check if these exist:
dir node_modules\electron\dist\electron.exe
dir node_modules\socket.io-client
```

### 5. Configure System
```javascript
// Edit main-simple.js

// Line ~30: Set server URL
const SERVER_URL = 'http://192.168.1.100:5003';  // Your server IP

// Line ~50: Set system number
const SYSTEM_NUMBER = 'CC1-01';  // Change for each system
```

### 6. Start Kiosk
```batch
# Method 1: With admin rights (recommended)
START_WITH_ADMIN.bat

# Method 2: Manual
npm start
```

---

## Verification Checklist

After installation, verify:

- [ ] Node.js installed and in PATH
- [ ] npm working (`npm --version` succeeds)
- [ ] Kiosk folder exists at correct location
- [ ] All files present (package.json, main-simple.js, etc.)
- [ ] node_modules folder exists with Electron
- [ ] Server is running on 192.168.1.100:5003
- [ ] Can ping server: `ping 192.168.1.100`
- [ ] Can reach port: Test-NetConnection
- [ ] System number configured correctly
- [ ] Running as Administrator

---

## Getting Live Error Messages

To see what's actually failing:

```batch
# Open Command Prompt as Administrator
cd D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk

# Run kiosk (errors will show in console)
npm start

# Read error messages carefully
# Common errors:
# - "Cannot find module" → npm install missing
# - "ECONNREFUSED" → Server not running
# - "address already in use" → Port conflict
# - "Permission denied" → Need admin rights
```

---

## Emergency Contact Info

If still not working, check:

1. **Node.js version:** Must be v16+ (v18 or v20 recommended)
2. **Windows version:** Windows 10/11 required
3. **Antivirus:** May block Electron - add exception
4. **Network:** Student systems must reach server IP
5. **File paths:** Must match exactly as shown

---

## Quick Test Commands

```batch
REM Test Node.js
node -e "console.log('Node works!')"

REM Test server connection
curl http://192.168.1.100:5003/api/health

REM Test Electron
cd D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk
node_modules\.bin\electron --version

REM List dependencies
npm list --depth=0
```

---

## What to Check Right Now

Run these commands in order:

```batch
# 1. Check Node.js
node --version

# 2. Check current directory
cd

# 3. Navigate to kiosk
cd D:\SDC_Lab_monitoing_system\student_deployment_package\student-kiosk

# 4. Check files exist
dir

# 5. Check dependencies
dir node_modules

# 6. Try to start
npm start
```

**Copy the error message and we can fix it!** 🔧
