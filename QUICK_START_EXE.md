# Quick Start - Build and Deploy Windows EXE

## 5-Minute Setup

### Prerequisites
- Node.js v16+ installed
- npm (comes with Node.js)
- Administrative access to Windows machines

### Step 1: Build the Installer (1 minute)

```powershell
cd d:\screen_mirror_deployment_my_laptop\student-kiosk\desktop-app
npm install
npm run build-win
```

**Output**: `dist\College-Lab-Kiosk-Setup-1.0.0.exe`

### Step 2: Deploy to Student PC (2 minutes)

```powershell
# Copy installer
Copy-Item "dist\College-Lab-Kiosk-Setup-1.0.0.exe" "\\StudentPC\c$\Downloads\"

# Run installer on student PC (with admin rights)
# Then double-click the file or run:
& "C:\Downloads\College-Lab-Kiosk-Setup-1.0.0.exe"
```

### Step 3: Verify Installation

On next Windows reboot:
1. ✅ Kiosk launches automatically in full-screen
2. ✅ Student sees login screen
3. ✅ After login: timer minimizes, other apps usable
4. ✅ On logout: 90-second shutdown timer appears

---

## What's Changed (Quick Summary)

| Feature | Before | After |
|---------|--------|-------|
| Before Login | Could minimize | Full-screen lock, blocks all apps ✅ |
| After Login | Stays locked | Other apps work normally ✅ |
| Timer Window | Visible, closable | Auto-minimizes, non-closable ✅ |
| Shutdown Delay | 30 seconds | 90 seconds (1:30) ✅ |
| Timetable Upload | Simple text | Bold notification with count ✅ |
| Auto-Launch | Manual startup | Automatic on Windows login ✅ |

---

## File Changes Summary

### Modified Files
1. **`student-kiosk/desktop-app/main-simple.js`** (5 changes)
   - Timer auto-minimize: Line 268-277
   - 90-second logout delay: Line 458-502
   - 90-second admin shutdown: Line 590-608
   - Timer close prevention: Line 301-318

2. **`student-kiosk/desktop-app/package.json`** (1 change)
   - NSIS installer config with auto-launch

3. **`central-admin/dashboard/admin-dashboard.html`** (1 change)
   - Timetable upload notification: Line 3048-3110

### New Files
1. **`student-kiosk/desktop-app/build/installer.nsh`**
   - Windows installer script with auto-launch registry entries

2. **`student-kiosk/desktop-app/BUILD_WINDOWS_EXE.md`**
   - Comprehensive build and deploy guide (100+ lines)

3. **`IMPLEMENTATION_COMPLETE.md`** (this directory)
   - Detailed technical implementation summary

---

## Testing Checklist (3 minutes)

Before deployment:

```powershell
# 1. Build test
npm run build-win
# Expected: ✅ dist\College-Lab-Kiosk-Setup-1.0.0.exe created

# 2. Test on VM or isolated PC
# Run installer → Reboot → Verify auto-launch ✅
```

Key test points:
- [ ] Before login: Everything blocked except login screen
- [ ] After login: Can open other applications  
- [ ] Timer window minimized and can't be closed
- [ ] Logout shows 90-second countdown
- [ ] On next login: Auto-launches in kiosk mode

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Build fails: "electron not found" | Run `npm install` first |
| Kiosk doesn't auto-launch after reboot | Check registry: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run` |
| Shutdown happens in 30s not 90s | Verify all `/t 90` in main-simple.js |
| Timer window can be closed | Ensure logout handler is working |
| DLL errors on student PC | Visual C++ Redistributable needed (usually pre-installed) |

---

## Rollback (if needed)

```powershell
# On student PC, uninstall from Control Panel:
# Settings → Apps → Apps & features → College Lab Kiosk → Uninstall

# Or use command:
# & "C:\Program Files\College Lab Kiosk\Uninstall.exe"
```

---

## Important Notes

⚠️ **Admin Rights Required**
- Installer requires administrator privileges
- Kiosk app needs admin rights to block system shortcuts

⚠️ **Auto-Launch Registry**
- Entry stored in Windows registry
- Survives Windows updates
- Uninstaller automatically removes entry

⚠️ **Shutdown Delay**
- 90 seconds = 1 minute 30 seconds
- Student sees countdown dialog
- Shutdown can be cancelled with `shutdown /a` command

---

## Need Help?

1. **Build issues**: See `BUILD_WINDOWS_EXE.md` → Troubleshooting
2. **Feature questions**: See `IMPLEMENTATION_COMPLETE.md` → Technical Summary
3. **Code changes**: See specific section in `IMPLEMENTATION_COMPLETE.md`

---

## Next Steps

1. ✅ Build the EXE: `npm run build-win`
2. ✅ Test on development PC
3. ✅ Deploy to student lab PCs
4. ✅ Configure server IP in `server-config.json`
5. ✅ Verify auto-launch on reboot

---

## Version Info

- **App**: College Lab Kiosk v1.0.0
- **Build**: Electron 22.0.0
- **Platform**: Windows x64
- **Installer**: NSIS with auto-launch
- **Install Path**: C:\Program Files\College Lab Kiosk

---

**Ready to deploy!** 🚀
