# ================================================================
# DEPLOY WINDOWS KEY DISABLE TO ALL 69 STUDENT SYSTEMS
# ================================================================
# Quick deployment guide via AnyDesk to disable Windows key
# ================================================================

## PREPARATION (ONE TIME):

1. On YOUR laptop:
   - Locate file: `DISABLE_WINDOWS_KEY.reg`
   - Keep file ready for copy-paste

2. Create a restart schedule:
   - Plan to restart all systems (required for registry to take effect)
   - Best time: After lab hours or during maintenance window

## DEPLOYMENT STEPS (PER SYSTEM):

### Connect via AnyDesk:
```
1. Open AnyDesk
2. Connect to student system (e.g., 1344131949)
3. Wait for connection
```

### Apply Registry Fix:
```
4. Open Notepad on student system
5. Copy content of DISABLE_WINDOWS_KEY.reg from your laptop
6. Paste into Notepad on student system
7. Save as: C:\DISABLE_WINKEY.reg
   (Make sure "Save as type" = "All Files")
8. Close Notepad
```

### Execute Fix:
```
9. Double-click C:\DISABLE_WINKEY.reg
10. Click "Yes" when prompted
11. You'll see: "Keys and values have been successfully added"
12. Click "OK"
```

### Restart System:
```
13. Right-click Start → Shut down or sign out → Restart
    OR
    Open CMD and type: shutdown /r /t 60
    (Restarts in 60 seconds - gives you time to disconnect)
```

### Verify After Restart:
```
14. Reconnect via AnyDesk after restart
15. Try pressing Windows key → Should do NOTHING
16. Start kiosk using LAUNCH_KIOSK_HIDDEN.vbs
17. Test: Press Windows key in kiosk → Start menu should NOT appear
```

## AUTOMATED DEPLOYMENT (FASTER):

Instead of manual registry editing, use the batch file:

```
1. Connect to student system via AnyDesk
2. Open File Explorer on student system
3. Navigate to C:\StudentKiosk\
4. Copy APPLY_WINKEY_DISABLE.bat from your laptop to this folder
5. Right-click → Run as Administrator
6. Follow prompts
7. Choose "Y" to restart immediately
```

## TIME ESTIMATE:

- Manual method: ~3 minutes per system × 69 = ~3.5 hours
- Automated batch: ~1.5 minutes per system × 69 = ~2 hours
- Can do 5-10 systems in parallel using multiple AnyDesk windows

## VERIFICATION CHECKLIST:

After deploying to ALL systems, verify ONE system completely:

- [ ] Windows key doesn't open Start menu (even without kiosk)
- [ ] Kiosk starts via VBS launcher (no CMD window)
- [ ] Escape key is blocked in kiosk
- [ ] F12 doesn't open DevTools
- [ ] Alt+Tab is blocked
- [ ] Ctrl+Alt+Del works (for emergency admin access)

## ROLLBACK PLAN:

If staff needs Windows key functionality back:

```
1. Copy RESTORE_WINDOWS_KEY.reg to system
2. Double-click it
3. Restart system
4. Windows key will work normally again
```

## TROUBLESHOOTING:

**Registry import fails:**
- Run CMD as Administrator
- Type: regedit /s C:\DISABLE_WINKEY.reg

**Windows key still works after restart:**
- Check registry: HKLM\SYSTEM\CurrentControlSet\Control\Keyboard Layout
- Should have "Scancode Map" value
- If missing, reapply the .reg file

**Need to test ONE system first:**
- Pick the least-used system in lab
- Apply fix, restart, test thoroughly
- If successful, deploy to all 69 systems

## NOTES:

- This is OS-level disabling - MORE POWERFUL than application blocking
- Works even outside kiosk mode
- Affects ALL users on the system
- Persists across kiosk updates
- Only restart removes/applies the setting

================================================================
ESTIMATED TOTAL DEPLOYMENT TIME: 2-4 hours for all 69 systems
================================================================
