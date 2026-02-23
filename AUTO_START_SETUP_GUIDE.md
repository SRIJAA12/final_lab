# 🚀 AUTO-START KIOSK ON WINDOWS LOGIN

## ✅ QUICK SETUP - 3 STEPS

### Step 1: Copy the VBS File
Copy this file to the student system:
```
START_KIOSK_SILENT.vbs
```

### Step 2: Place in Startup Folder
**Choose ONE of these locations:**

#### Option A - Current User Only (Recommended for Testing)
1. Press `Win + R`
2. Type: `shell:startup`
3. Press Enter
4. **Paste** `START_KIOSK_SILENT.vbs` into this folder

**Folder Path:** 
```
C:\Users\[USERNAME]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

#### Option B - All Users (Production - Requires Admin)
1. Press `Win + R`
2. Type: `shell:common startup`
3. Press Enter
4. **Paste** `START_KIOSK_SILENT.vbs` into this folder

**Folder Path:** 
```
C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup
```

### Step 3: Test
1. **Restart the computer** or **Log out and log back in**
2. Kiosk should start **automatically** and **silently** (no command window visible)
3. Kiosk login screen should appear immediately after Windows login

---

## 🔧 How It Works

The VBS script:
- ✅ Runs **completely hidden** (no CMD window visible)
- ✅ Auto-detects whether to use **npm start** (dev) or **EXE** (production)
- ✅ Searches multiple locations for the kiosk application
- ✅ Launches kiosk in background and exits immediately

---

## 📁 Files Needed

Place these files on the student system:

### For Development Mode (npm start):
- `START_KIOSK_SILENT.vbs` → Startup folder
- All kiosk files in: `student-kiosk/desktop-app/`
- Node.js must be installed

### For Production Mode (EXE):
- `START_KIOSK_SILENT.vbs` → Startup folder
- `student-kiosk.exe` → Any of these locations:
  - `C:\StudentKiosk\student-kiosk.exe`
  - `C:\Program Files\StudentKiosk\student-kiosk.exe`
  - `dist\student-kiosk.exe` (next to VBS file)

---

## 🧪 Testing Auto-Start

### Method 1: Restart Computer
```cmd
shutdown /r /t 0
```
After restart, kiosk should appear automatically.

### Method 2: Manual Test (Without Restart)
1. Double-click `START_KIOSK_SILENT.vbs`
2. Kiosk should launch with **no visible window**
3. If it works, it will work on startup too

### Method 3: Log Out and Back In
1. Press `Ctrl+Alt+Delete`
2. Click "Sign out"
3. Log back in
4. Kiosk should start automatically

---

## ❌ Troubleshooting

### Kiosk doesn't start on login
1. **Check Startup Folder:**
   - Press `Win + R` → Type `shell:startup` → Enter
   - Verify `START_KIOSK_SILENT.vbs` is there

2. **Check File Locations:**
   - Open Task Manager (`Ctrl+Shift+Esc`)
   - Look for `node.exe` or `student-kiosk.exe` process
   - If not running, the script couldn't find the kiosk

3. **Test VBS Script Manually:**
   - Double-click `START_KIOSK_SILENT.vbs`
   - If error message appears, read it carefully
   - If no error but no kiosk, check paths in the script

### Command window still visible
- Make sure you're using the **VBS file**, not a BAT file
- VBS files run silently by default

### Permission denied or access error
- The VBS file might be blocked by Windows
- Right-click `START_KIOSK_SILENT.vbs` → Properties
- If there's an "Unblock" checkbox at the bottom, **check it** and click OK

---

## 🔐 Running with Admin Rights (For Shutdown)

If you need the kiosk to have admin rights (for shutdown functionality):

### Option 1: Create Scheduled Task (Recommended)
1. Press `Win + R` → Type `taskschd.msc` → Enter
2. Click "Create Task" (not "Create Basic Task")
3. **General Tab:**
   - Name: `Student Kiosk Auto-Start`
   - ✅ Check: "Run with highest privileges"
   - Configure for: Windows 10
4. **Triggers Tab:**
   - Click "New"
   - Begin the task: "At log on"
   - Specific user: (current student account)
   - Click OK
5. **Actions Tab:**
   - Click "New"
   - Action: "Start a program"
   - Program/script: `wscript.exe`
   - Add arguments: `"C:\Path\To\START_KIOSK_SILENT.vbs"`
   - Click OK
6. **Settings Tab:**
   - ✅ "Allow task to be run on demand"
   - ✅ "Run task as soon as possible after a scheduled start is missed"
   - ✅ "If the task fails, restart every: 1 minute"
   - ✅ "Attempt to restart up to: 3 times"
7. Click OK, enter admin password if prompted

### Option 2: Modify VBS to Request Admin
Replace the VBS content with this (prompts UAC every time):
```vbscript
If Not WScript.Arguments.Named.Exists("elevated") Then
  CreateObject("Shell.Application").ShellExecute "wscript.exe", """" & WScript.ScriptFullName & """ /elevated", "", "runas", 1
  WScript.Quit
End If

' Rest of the script here...
```

---

## 📊 Verification Checklist

After setup, verify:
- ✅ VBS file is in Startup folder
- ✅ Restart computer → Kiosk appears automatically
- ✅ No command prompt window visible
- ✅ Kiosk shows login screen
- ✅ System number is correct
- ✅ Can login normally

---

## 🗂️ Alternative: Create Shortcut (Less Recommended)

If VBS doesn't work, create a shortcut instead:

1. Right-click in Startup folder → New → Shortcut
2. **Target:**
   ```
   "C:\Path\To\student-kiosk.exe"
   ```
   OR for npm:
   ```
   cmd /c "cd /d C:\Path\To\desktop-app && npm start"
   ```
3. Click Next, give it a name, click Finish
4. Right-click shortcut → Properties
5. **Run:** Change to "Minimized"
6. Click OK

**Note:** This shows a minimized window briefly. VBS is better for silent startup.

---

## ✅ Recommended Setup for Production

**For ALL student systems:**
1. Build the EXE: `npm run build-win`
2. Install to: `C:\StudentKiosk\`
3. Copy VBS to: `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup`
4. Set up Windows auto-login (if needed - see below)

---

## 🔓 BONUS: Windows Auto-Login (Optional - Not Recommended for Security)

If you want Windows to login automatically without password:

### WARNING: Only use on dedicated kiosk machines in secure lab

1. Press `Win + R`
2. Type: `netplwiz` or `control userpasswords2`
3. Press Enter
4. **Uncheck:** "Users must enter a user name and password to use this computer"
5. Click Apply
6. Enter the username and password to auto-login
7. Click OK
8. Restart - Windows will login automatically

**Security Risk:** Anyone with physical access can use the computer!

---

**File:** `START_KIOSK_SILENT.vbs`  
**Location:** Place in Windows Startup folder  
**Visibility:** Completely hidden (no windows)  
**Tested on:** Windows 10/11
