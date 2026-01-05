# 🔧 TROUBLESHOOTING GUIDE - Common Issues & Solutions

## 🚨 CRITICAL FIXES APPLIED

### ✅ Fixed: Kiosk Blinking/Flickering
**Problem:** Kiosk window was blinking and VS Code was visible behind it
**Root Cause:** `setInterval` was forcing kiosk mode every 500ms, causing constant window refreshing
**Solution Applied:**
- Removed aggressive 500ms interval loop
- Added focus-based restoration (only when window loses focus)
- Added proper initialization delay
- Window stays hidden until fully loaded
- Result: **Smooth, no blinking, completely blocks everything**

### ✅ Fixed: Database Not Syncing Between Systems
**Problem:** Changes in Compass on your laptop don't appear on friend's system
**Root Cause:** Using local MongoDB on your laptop only
**Solution:**
- Option 1: Keep using cloud MongoDB Atlas (already configured)
- Option 2: Install MongoDB on admin system in lab
- All 60 student systems connect to ONE central database

---

## 🐛 COMMON ISSUES

### 1. Kiosk Still Blinking or Showing Desktop

**Symptoms:**
- Window flickers
- Desktop/taskbar visible for a moment
- VS Code appears briefly

**Solutions:**

**A. Make sure you rebuild the EXE with the fixes:**
```powershell
cd student-kiosk\desktop-app
npm run build-win
```

**B. If running in VS Code (npm start):**
- This is normal during development
- Kiosk mode works best in production EXE
- To test properly, use the built EXE

**C. Check if KIOSK_MODE is enabled:**
Open `student-kiosk\desktop-app\main-simple.js`, line ~120:
```javascript
const KIOSK_MODE = true; // Must be true for production
```

**D. Verify no other apps are stealing focus:**
- Close all apps before testing
- Disable antivirus temporarily for testing
- Check Windows notification settings

---

### 2. Student Systems Can't Connect to Server

**Symptoms:**
- Kiosk shows "Connecting to server..."
- Admin dashboard shows no students
- Login fails

**Check List:**

**Step 1: Verify Network Connectivity**
```powershell
# On student system:
ping 192.168.1.1

# Should get replies. If not, check:
# - Are they on same network?
# - Is admin IP correct?
```

**Step 2: Verify Server is Running**
```powershell
# On admin system:
cd central-admin\server
node app.js

# Should show:
# ✅ MongoDB connected successfully
# ✅ Server running on port 7401
```

**Step 3: Check Firewall**
```powershell
# On admin system (Run as Administrator):
netsh advfirewall firewall add rule name="Lab Server" dir=in action=allow protocol=TCP localport=7401
```

**Step 4: Verify server-config.json**
On student system:
```
C:\Program Files\Student Lab Kiosk\resources\server-config.json
```
Should contain:
```json
{
  "serverIp": "192.168.1.1",
  "serverPort": "7401",
  "autoDetect": false
}
```

**Step 5: Test from Browser**
On student system, before running kiosk:
- Open browser
- Go to: `http://192.168.1.1:7401`
- Should see server status page
- If this works, kiosk should work too

---

### 3. Database Issues

#### A. Changes Not Syncing Between Systems

**Current Setup (Cloud MongoDB):**
- You're using MongoDB Atlas (cloud)
- Changes should sync automatically
- Requires internet connection

**If using local MongoDB:**
- MongoDB must be on admin system only
- All systems must connect to admin IP
- Check `.env` file:
```env
# For LOCAL MongoDB on admin system:
MONGODB_URI=mongodb://192.168.1.1:27017/student_lab_system
```

#### B. "MongoDB Connection Error"

**Check MongoDB Service (on admin system):**
```powershell
# Check status
Get-Service MongoDB

# If not running:
net start MongoDB
```

**Verify MongoDB is listening:**
```powershell
netstat -an | findstr "27017"
# Should show: TCP    0.0.0.0:27017    LISTENING
```

**Edit MongoDB config for network access:**
1. Open: `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`
2. Change:
```yaml
net:
  port: 27017
  bindIp: 0.0.0.0  # Allow all IPs
```
3. Restart MongoDB:
```powershell
net stop MongoDB
net start MongoDB
```

#### C. "Student ID already exists" errors

**Clean up duplicate entries:**
```javascript
// In MongoDB Compass or shell:
use student_lab_system

// Find duplicates
db.students.aggregate([
  { $group: { _id: "$studentId", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Remove duplicates (keep newest)
db.students.find().sort({_id:-1}).forEach(function(doc) {
  db.students.remove({studentId: doc.studentId, _id: {$ne: doc._id}});
});
```

---

### 4. Screen Mirroring Not Working

**Symptoms:**
- Student logged in successfully
- Admin dashboard shows session
- But no video/black screen

**Solutions:**

**A. Check WebRTC Permissions**
- Screen sharing needs to be approved
- In production EXE, this is automatic
- Verify in console (F12 on admin dashboard)

**B. Check Network/Firewall**
- WebRTC needs UDP ports
- Add firewall rules:
```powershell
# On admin system:
netsh advfirewall firewall add rule name="WebRTC UDP" dir=in action=allow protocol=UDP localport=10000-20000
```

**C. Verify Socket.io Connection**
Open browser console (F12) on admin dashboard:
```javascript
// Should see:
✅ Socket.io connected
🎥 Requesting kiosk stream for session: ...
```

**D. Check Student System**
On student system, check logs:
```
C:\Users\[Username]\AppData\Roaming\Student Lab Kiosk\logs\
```

Look for:
```
✅ Screen capture started
✅ Peer connection created
🧊 ICE candidate sent
```

---

### 5. Student Can't Login

**Symptoms:**
- "Invalid credentials" error
- Student exists in database

**Solutions:**

**A. Verify Student Exists**
Open student-management-system.html on admin system:
- Search for student
- Check if student ID matches exactly (case-sensitive!)

**B. Reset Password**
1. Admin dashboard → Manage Students
2. Find student → Reset Password
3. Set temporary password
4. Student uses temporary password on kiosk

**C. Check Case Sensitivity**
Student IDs are case-sensitive:
- `CS2024001` ≠ `cs2024001`
- Make sure students enter exactly as in database

**D. Database Connection**
Verify server is connected to database:
- Check server terminal
- Should show: `✅ MongoDB connected successfully`
- If not, check MongoDB service

---

### 6. Kiosk Not Auto-Starting

**Symptoms:**
- Student must manually start kiosk after Windows login

**Solutions:**

**A. Check Registry Entry**
```powershell
# Run as Administrator:
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" | findstr "Student"
```

**B. Manually Add Registry Entry**
```powershell
# Run as Administrator:
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "StudentLabKiosk" /t REG_SZ /d "C:\Program Files\Student Lab Kiosk\Student Lab Kiosk.exe" /f
```

**C. Check Startup Folder**
```
C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp
```
Add shortcut to kiosk EXE here as alternative

**D. Reinstall with NSIS Installer**
- The built installer automatically adds registry entry
- Make sure to use: `Student Lab Kiosk Setup 1.0.0.exe`
- Not just copying the .exe file

---

### 7. "Node.js Not Found" Error

**When running server:**
```
'node' is not recognized as an internal or external command
```

**Solution:**
1. Install Node.js: https://nodejs.org/
2. Choose LTS version (v18+)
3. Install with default settings
4. **Restart terminal/command prompt**
5. Verify:
```powershell
node --version
# Should show: v18.x.x or higher
```

---

### 8. Student System Number Not Showing Correctly

**Symptoms:**
- All students show as "PC-01" or random numbers
- Can't identify which physical PC is which

**Solution:**

**Set Environment Variable on Each PC:**
1. Right-click "This PC" → Properties
2. Advanced system settings → Environment Variables
3. Under "System variables" (not User), click "New"
4. Variable name: `SYSTEM_NUMBER`
5. Variable value: `PC-01` (for first PC), `PC-02` (for second), etc.
6. Click OK, restart kiosk app

**Verify:**
Check in admin dashboard - should show correct PC number

---

### 9. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::7401
```

**Solution:**

**A. Find what's using port 7401:**
```powershell
netstat -ano | findstr ":7401"
```

**B. Kill the process:**
```powershell
# Note the PID from above command, then:
taskkill /PID [PID] /F
```

**C. Change port (if needed):**
Edit `.env` in server folder:
```env
PORT=7401  # Change to 7402 or any other port
```

Then update `server-config.json` on all student systems

---

### 10. Slow Performance / Lag

**Symptoms:**
- Screen mirroring is laggy
- Dashboard takes long to load
- Multiple students cause slowdown

**Solutions:**

**A. Check Network Quality**
- Use Ethernet instead of WiFi
- Ensure admin system has good connection
- Consider gigabit switch for 60 systems

**B. Admin System Specs**
Recommended:
- CPU: i5 or better (for handling 60 streams)
- RAM: 16GB minimum
- Network: Gigabit Ethernet

**C. Reduce Video Quality**
Edit `student-kiosk\desktop-app\renderer.js`, line ~230:
```javascript
const displayConstraints = {
    video: {
        displaySurface: "monitor",
        width: { ideal: 1280 },  // Reduce from 1920
        height: { ideal: 720 },  // Reduce from 1080
        frameRate: { ideal: 15 } // Reduce from 30
    }
};
```

**D. View Fewer Streams Simultaneously**
- Don't view all 60 screens at once
- View 4-6 at a time
- Switch between sessions as needed

---

## 🔍 DIAGNOSTIC COMMANDS

### Check Everything At Once

**On Admin System:**
```powershell
# 1. Check MongoDB
Get-Service MongoDB

# 2. Check if port is open
netstat -an | findstr "7401"

# 3. Check IP address
ipconfig | findstr "IPv4"

# 4. Start server with debug
cd central-admin\server
$env:DEBUG="*"
node app.js
```

**On Student System:**
```powershell
# 1. Check connection to admin
ping 192.168.1.1

# 2. Test HTTP connection
curl http://192.168.1.1:7401

# 3. Check environment variable
echo %SYSTEM_NUMBER%

# 4. View kiosk logs
type "C:\Users\%USERNAME%\AppData\Roaming\Student Lab Kiosk\logs\main.log"
```

---

## 📞 GETTING MORE HELP

### Collect Debug Information

**Before asking for help, collect:**

1. **Server Logs:**
```
central-admin\server\server-log.txt
```

2. **Kiosk Logs:**
```
C:\Users\[Username]\AppData\Roaming\Student Lab Kiosk\logs\
```

3. **Network Configuration:**
```powershell
ipconfig /all > network-info.txt
```

4. **Server Status:**
```powershell
curl http://192.168.1.1:7401/api/status > server-status.txt
```

5. **Error Messages:**
- Screenshot any error messages
- Note exact steps to reproduce

---

## ✅ VERIFICATION CHECKLIST

Use this to verify everything is working:

### Admin System:
- [ ] Static IP set (192.168.1.1)
- [ ] MongoDB service running
- [ ] Server starts without errors
- [ ] Can access dashboard in browser
- [ ] Firewall rules added
- [ ] student-management-system.html works
- [ ] Can add/edit students

### Student System (test on 1, then deploy to all):
- [ ] Static IP set correctly
- [ ] Can ping admin system
- [ ] Can access http://192.168.1.1:7401 in browser
- [ ] Kiosk installs successfully
- [ ] server-config.json has correct IP
- [ ] SYSTEM_NUMBER environment variable set
- [ ] Kiosk auto-starts on Windows login
- [ ] Kiosk is fullscreen, no blinking
- [ ] Can login with test credentials
- [ ] Screen appears on admin dashboard
- [ ] Admin can view live screen

---

## 🚀 QUICK FIXES

| Problem | Quick Fix |
|---------|-----------|
| Kiosk blinking | Rebuild EXE with new code |
| Can't connect to server | Check firewall, ping admin IP |
| Database not syncing | Verify all systems use same MONGODB_URI |
| No screen mirroring | Check WebRTC permissions, network |
| Student can't login | Verify credentials, check database |
| Port in use | Kill process or change port |
| Auto-start not working | Check registry entry |
| Slow performance | Reduce video quality, use Ethernet |

---

**Remember: Test on 1-2 systems first before deploying to all 60!**
