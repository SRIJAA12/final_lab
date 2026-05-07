# 🎓 STUDENT KIOSK DEPLOYMENT PACKAGE

**Admin Server IP:** 10.10.46.103:7401

---

## 📂 FILES IN THIS PACKAGE

- **INSTALL_KIOSK.bat** - Main installation script
- **TEST_CONNECTION.bat** - Test connection to admin server
- **SET_SYSTEM_NUMBER.bat** - Set system number (PC-01, PC-02, etc.)
- **server-config.json** - Server configuration (10.10.46.103)
- **student-kiosk/** - Kiosk application files
- **DEPLOYMENT_GUIDE.md** - Complete step-by-step guide

---

## ⚡ QUICK START

### On Each Student System:

1. **Copy this entire folder to:** `C:\Temp\student_kiosk\`

2. **Install Node.js** (if not installed):
   - Download from: https://nodejs.org/
   - Or use installer from USB

3. **Run installation:**
   ```cmd
   cd C:\Temp\student_kiosk
   INSTALL_KIOSK.bat
   ```

4. **Set system number:**
   ```cmd
   SET_SYSTEM_NUMBER.bat
   ```
   Enter: PC-01, PC-02, PC-03, etc.

5. **Test connection:**
   ```cmd
   TEST_CONNECTION.bat
   ```

6. **Restart computer:**
   ```cmd
   shutdown /r /t 0
   ```

---

## ✅ WHAT THIS DOES

- Installs kiosk to `C:\StudentKiosk`
- Configures connection to admin server (10.10.46.103:7401)
- Sets up auto-start on Windows login
- Creates desktop shortcut

---

## 📖 DETAILED GUIDE

See **DEPLOYMENT_GUIDE.md** for complete instructions and troubleshooting.

---

## 🆘 QUICK HELP

**Kiosk not starting?**
```cmd
cd C:\StudentKiosk
npm start
```

**Connection issues?**
```cmd
ping 10.10.46.103
TEST_CONNECTION.bat
```

**Wrong system number?**
```cmd
SET_SYSTEM_NUMBER.bat
```

---

**Questions? Check DEPLOYMENT_GUIDE.md**
