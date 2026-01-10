# TSI Account & Forgot Password Troubleshooting Guide

## Problem Summary
1. **TSI account (subhahrini) not working** - Login fails
2. **Forgot password not working** - OTP not being received

---

## Remote Diagnosis (From Your Laptop via AnyDesk)

### Method 1: Using the Quick Fix Batch File
1. On your laptop, run: `QUICK_FIX_TSI.bat`
2. Enter the server IP address when prompted
3. Wait for diagnostics to complete
4. Use AnyDesk to view output files on server:
   - `d:\screen_mirror_deployment\central-admin\server\tsi-fix-output.txt`
   - `d:\screen_mirror_deployment\central-admin\server\forgot-password-output.txt`

### Method 2: Manual Remote Commands
Run these commands from your laptop (PowerShell or CMD):

```batch
# Replace SERVER_IP with actual server IP
set SERVER_IP=192.168.1.100

# Run TSI diagnostic
wmic /node:"%SERVER_IP%" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node fix-tsi-student.js > tsi-result.txt 2>&1"

# Wait 10 seconds, then run forgot password diagnostic
wmic /node:"%SERVER_IP%" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node diagnose-forgot-password.js > forgot-result.txt 2>&1"
```

Then use AnyDesk to view the result files on the server.

---

## Common Issues & Solutions

### Issue 1: TSI Student Not Found in Database
**Symptom:** Login fails, "Student not found" error

**Cause:** Student was not properly saved when added via student-management-system.html

**Solution:**
1. Using AnyDesk on student laptop, open browser
2. Navigate to: `http://SERVER_IP:7401/student-management-system.html`
3. Add student again with ALL required fields:
   - Name: Subhahrini
   - Student ID: TSI001 (or TSI002, TSI003, etc.)
   - Email: valid-email@college.edu
   - Password: Set a password (e.g., "password123")
   - Date of Birth: dd/mm/yyyy
   - Register Number: Valid number
   - Department: CSE/ECE/etc.
   - Year: 1-4
   - Section: A/B/C
   - Lab ID: Your lab ID
   - System Number: 1-60
   - MAC Address: (optional)
   - IP Address: (optional)
4. Click "Add Student" button
5. Verify success message appears
6. Test login immediately

---

### Issue 2: Student Exists But No Password Set
**Symptom:** Login fails even though student was added

**Cause:** Password field was not properly set during student creation

**Solution A - Auto-Fix (Recommended):**
1. Run `QUICK_FIX_TSI.bat` from your laptop
2. Script will automatically set password to "password123"
3. Test login with:
   - Student ID: TSI### 
   - Password: password123
4. After successful login, change password

**Solution B - Manual Fix via AnyDesk:**
1. Connect to student laptop via AnyDesk
2. Open: `http://SERVER_IP:7401/student-signin/`
3. Use "First-Time Sign-In" option
4. Enter:
   - Student ID: TSI###
   - Date of Birth: (as registered)
5. Set new password
6. Login with new password

---

### Issue 3: Forgot Password Not Working
**Symptom:** "Forgot Password" doesn't send OTP email

**Causes & Solutions:**

#### Cause A: Email Not Configured on Server
**Check:** Run `diagnose-forgot-password.js` to see if email is configured

**If email is NOT configured:**
- OTPs are logged to server console instead
- Check: `d:\screen_mirror_deployment\central-admin\server\server-log.txt`
- Look for lines like: `🔢 OTP CODE: 123456`
- Copy the OTP and use it in kiosk

**To configure email (requires server access):**
1. Create/edit `.env` file on server at: `d:\screen_mirror_deployment\central-admin\server\.env`
2. Add these lines:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-specific-password
   ```
3. Restart server
4. Test forgot password again

#### Cause B: Invalid Email for Student
**Check:** Does student's email look valid? (has @ symbol, domain, etc.)

**Solution:** Update student's email:
1. Open `student-management-system.html`
2. Find the TSI student
3. Update email to valid format
4. Try forgot password again

---

## Testing After Fixes

### Test 1: Login Test
1. On student kiosk, try to login:
   - Student ID: TSI###
   - Password: (the password you set)
2. Should succeed and show student interface

### Test 2: Forgot Password Test
1. On student kiosk, click "Forgot Password"
2. Enter Student ID: TSI###
3. Enter Email: (registered email)
4. Click "Send OTP"
5. Check server logs for OTP: `server-log.txt`
6. Enter OTP in kiosk
7. Set new password
8. Login with new password

---

## Quick Commands Reference

### From Your Laptop (via WMIC):

```batch
# Check if server is reachable
ping SERVER_IP

# Run diagnostic scripts
wmic /node:"SERVER_IP" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && node fix-tsi-student.js > output.txt 2>&1"

# Check if Node server is running
wmic /node:"SERVER_IP" process where "name='node.exe'" get ProcessId,CommandLine

# Restart Node server (if needed)
wmic /node:"SERVER_IP" process where "name='node.exe'" call terminate
wmic /node:"SERVER_IP" process call create "cmd /c cd /d d:\screen_mirror_deployment\central-admin\server && start /min node app.js"
```

### Via AnyDesk on Student Laptop:

```batch
# Navigate to server directory
cd d:\screen_mirror_deployment\central-admin\server

# Run diagnostic scripts
node fix-tsi-student.js
node diagnose-forgot-password.js

# Check students in database
node check-students.js

# View server logs
type server-log.txt | more

# Check last 50 lines of log
powershell -command "Get-Content server-log.txt -Tail 50"
```

---

## Verification Checklist

After applying fixes, verify:

- [ ] TSI student exists in database
- [ ] TSI student has password set
- [ ] Email is valid format
- [ ] Can login with credentials
- [ ] Forgot password sends OTP (check logs)
- [ ] OTP can be used to reset password
- [ ] Other 3 accounts still work

---

## Emergency Contact Points

1. **If nothing works:** Re-add student from scratch
2. **If can't access server remotely:** Use AnyDesk to access server directly
3. **If server is down:** Check if Node.js process is running
4. **If database is corrupted:** Use backup restore scripts

---

## Files Created for You

1. `QUICK_FIX_TSI.bat` - Automated remote fix
2. `fix-tsi-student.js` - Checks and fixes TSI account
3. `diagnose-forgot-password.js` - Tests forgot password feature
4. `REMOTE_DIAGNOSE_TSI.bat` - Detailed remote diagnostic

**Location:** `d:\screen_mirror_deployment\`

---

## Expected Behavior After Fix

### Successful Login:
```
Student ID: TSI001
Password: password123 (or whatever was set)
Result: → Student interface loads with student name
```

### Successful Forgot Password:
```
1. Enter Student ID: TSI001
2. Enter Email: student@college.edu
3. OTP sent (check server logs if email not configured)
4. Enter OTP: 123456
5. Set new password
6. Login with new password → Success
```

---

## Notes

- All diagnostic scripts output to `.txt` files for easy viewing
- Server logs are at: `central-admin/server/server-log.txt`
- Email configuration is optional for testing (OTPs log to console)
- For production deployment, configure proper SMTP email
- Change default passwords after testing!
