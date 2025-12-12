# 🚀 QUICK START FOR TEAM MEMBERS

## ✅ Good News: Database is Already Set Up!

Your teammate has already configured a **shared MongoDB Atlas database**. You just need to clone and run!

---

## 📥 Step 1: Clone the Project

```bash
git clone https://github.com/SRIJAA12/final_sdc.git
cd final_sdc
```

---

## 📦 Step 2: Install Dependencies

### Install Server Dependencies:
```bash
cd central-admin/server
npm install
```

### Install Kiosk Dependencies (Optional):
```bash
cd ../../student-kiosk/desktop-app
npm install
```

---

## 🧪 Step 3: Test Database Connection

Before starting the server, verify you can connect to the database:

```bash
cd central-admin/server
node test-db-connection.js
```

**Expected Output:**
```
✅ Successfully connected to MongoDB Atlas!
📊 Database Name: college-lab-registration
👥 Total Students: X
✅ Database is working correctly!
```

If you see this, you're good to go! 🎉

---

## 🚀 Step 4: Start the Server

```bash
cd central-admin/server
node app.js
```

**Expected Output:**
```
✅ MongoDB Connected: cluster0.2kzkkpe.mongodb.net
🗄️ Database: college-lab-registration
🌐 Server IP: 192.168.x.x
🚀 Server running on: http://localhost:7401
```

---

## 🌐 Step 5: Open Admin Dashboard

Open your browser and go to:
```
http://localhost:7401/admin-dashboard.html
```

**Admin Login:**
- Username: `admin`
- Password: `admin123`

---

## ✅ What You'll See

You will have access to:
- ✅ **All students** your teammate added
- ✅ **All timetables** uploaded
- ✅ **All session history**
- ✅ **All system configurations**

Everything is **synchronized automatically**! 🔄

---

## 🔧 Troubleshooting

### Issue: "MongoServerError: Authentication failed"
**Solution:** The database password might have changed. Contact your teammate.

### Issue: "Could not connect to MongoDB"
**Possible Causes:**
1. No internet connection
2. Your IP is not whitelisted in MongoDB Atlas
3. Firewall blocking connection

**Solution:**
1. Check your internet connection
2. Ask your teammate to whitelist your IP in MongoDB Atlas:
   - Go to MongoDB Atlas → Network Access
   - Add your IP address
   - Or add `0.0.0.0/0` to allow all IPs (less secure but works)

### Issue: "Port 7401 already in use"
**Solution:** Another process is using the port.
```bash
# Windows:
netstat -ano | findstr :7401
taskkill /PID <PID_NUMBER> /F

# Or change the port in app.js (line ~100)
const PORT = process.env.PORT || 7402;  // Change to 7402
```

---

## 📁 Project Structure

```
final_sdc/
├── central-admin/
│   ├── server/               # Backend API server
│   │   ├── app.js           # Main server file
│   │   ├── test-db-connection.js  # Test database
│   │   └── package.json     # Dependencies
│   └── dashboard/           # Admin dashboard UI
│       └── admin-dashboard.html
├── student-kiosk/
│   └── desktop-app/         # Electron kiosk application
└── DATABASE_SETUP_GUIDE.md  # Detailed database docs
```

---

## 💡 Important Notes

### ✅ Shared Database
- Changes you make are visible to everyone
- Be careful when deleting data!
- All team members work on the same database

### 📝 Local Files (Not Shared)
- Server logs (`server-log.txt`)
- Report CSV files (`reports/`)
- Screenshots

These are stored locally. To share them, use:
- Google Drive
- Email
- WhatsApp

---

## 🧪 Verify Everything Works

### Test 1: Check Students
1. Start server: `node app.js`
2. Open: http://localhost:7401/admin-dashboard.html
3. Login with admin credentials
4. You should see existing students

### Test 2: Add a Test Student
1. Go to: http://localhost:7401/student-management-system.html
2. Add a new student
3. Ask your teammate to refresh their dashboard
4. They should see the new student!

### Test 3: Kiosk Login
1. Build kiosk: `cd student-kiosk/desktop-app && npm run build-win`
2. Install and run the kiosk
3. Login with a student account
4. Check if it works!

---

## 📞 Need Help?

1. **Read full documentation:** `DATABASE_SETUP_GUIDE.md`
2. **Check features list:** `COMPLETE_FEATURES_LIST.md`
3. **Contact your teammate** if database issues persist

---

## 🎯 Quick Commands Summary

```bash
# Clone project
git clone https://github.com/SRIJAA12/final_sdc.git
cd final_sdc

# Install dependencies
cd central-admin/server
npm install

# Test database
node test-db-connection.js

# Start server
node app.js

# Open admin dashboard
# Browser: http://localhost:7401/admin-dashboard.html
```

---

**✅ You're ready to collaborate!**  
**✅ Database is automatically synchronized!**  
**✅ No manual setup needed!**

---

**Last Updated:** December 12, 2025  
**Repository:** https://github.com/SRIJAA12/final_sdc  
**Status:** Ready for Team Collaboration ✅
