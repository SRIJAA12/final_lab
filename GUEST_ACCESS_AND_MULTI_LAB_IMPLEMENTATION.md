# Guest Access & Multi-Lab Support Implementation

## ✅ Implementation Complete

This document summarizes the implementation of two major features:

1. **Admin Bypass Login / Guest Access**
2. **Multi-Lab Support and Isolation**

---

## 1. Guest Access / Bypass Login Feature

### Overview
Allows admin to remotely unlock a student kiosk without requiring student login credentials. Useful for guest users or external users who need temporary access.

### Implementation Details

#### **Kiosk Side (`student-kiosk/desktop-app/`)**

**Files Modified:**
- `renderer.js`: Added `handleGuestAccess()` function that listens for `guest-access-granted` socket event
- `main-simple.js`: Added `guest-login` IPC handler that creates guest session with `isGuest: true`
- `preload.js`: Added `guestLogin()` and `triggerGuestLogin()` methods to electronAPI

**Key Features:**
- Guest session created with `studentId: 'GUEST'`, `studentName: 'Guest User'`
- System automatically unlocks (kiosk mode disabled)
- Guest mode indicator shown on screen
- Normal desktop usage allowed
- Timer window created (can be minimized)
- System remains connected to admin dashboard

#### **Server Side (`central-admin/server/app.js`)**

**New Socket Handler:**
```javascript
socket.on('grant-guest-access', async ({ systemNumber, labId }) => {
  // Finds kiosk by system number
  // Sends 'guest-access-granted' event to kiosk
  // Lab-scoped (admin can only grant access in their lab)
})
```

**Session Model:**
- Added `isGuest: Boolean` field to Session schema
- Guest sessions marked with `isGuest: true`

#### **Admin Dashboard (`central-admin/dashboard/admin-dashboard.html`)**

**UI Changes:**
- "🔓 Guest Access" button added to each student card
- Button only shown for non-guest sessions
- Guest sessions show "👤 Guest Mode" badge
- Success/error notifications for guest access operations

**Function:**
```javascript
function allowGuestAccess(sessionId, systemNumber) {
  // Confirms with admin
  // Emits 'grant-guest-access' socket event
  // Includes current labId for multi-lab support
}
```

### Flow:
1. Admin clicks "🔓 Guest Access" button on a system
2. Admin confirms the action
3. Server finds kiosk socket by system number
4. Server sends `guest-access-granted` event to kiosk
5. Kiosk receives event, calls `guestLogin()` IPC
6. Guest session created on server
7. Kiosk unlocks, shows guest mode indicator
8. Admin dashboard updates to show "Guest Mode" badge

---

## 2. Multi-Lab Support and Isolation

### Overview
Complete isolation between multiple labs (CC1, CC2, CC3, etc.). Each lab admin only sees their own lab's systems. No conflicts or mixing between labs.

### Implementation Details

#### **Lab Detection**

**Kiosk (`main-simple.js`):**
- `detectLabFromIP()` function maps IP prefixes to Lab IDs
- IP ranges configured:
  - `10.10.46.*` → CC1
  - `10.10.47.*` → CC2
  - `10.10.48.*` → CC3
  - `10.10.49.*` → CC4
  - `10.10.50.*` → CC5
  - Fallback: `192.168.*` ranges
- `LAB_ID` constant set at startup
- `SYSTEM_NUMBER` includes lab prefix (e.g., `CC1-01`)

**Server (`app.js`):**
- `detectLabFromIP(ip)` function for admin IP detection
- Same IP range mapping as kiosk
- Auto-detects lab from admin's IP address

#### **Lab-Scoped Operations**

**All operations are now lab-scoped:**

1. **Session Queries:**
   ```javascript
   Session.find({ status: 'active', labId: adminLabId })
   ```

2. **Lab Session Management:**
   ```javascript
   LabSession.findOne({ status: 'active', labId: adminLabId })
   ```

3. **Socket Rooms:**
   ```javascript
   socket.join(`admins-lab-${labId}`)
   socket.join(`lab-${labId}`)
   ```

4. **Guest Access:**
   - Only works within same lab
   - Admin cannot grant access to systems in different lab

5. **Shutdown Operations:**
   - `shutdown-all-systems` scoped by labId
   - Only affects systems in admin's lab

#### **Admin Dashboard**

**Lab Selector UI:**
- Dropdown in header: "🏢 Lab: [CC1|CC2|CC3|CC4|CC5]"
- Stored in `localStorage` for persistence
- Auto-detects from URL parameter `?labId=CC1`
- Falls back to prompt on first visit

**Lab Switching:**
```javascript
function changeLab(newLabId) {
  // Confirms with admin
  // Updates localStorage
  // Re-registers admin with new lab
  // Reloads sessions for new lab
}
```

**Session Loading:**
- `loadActiveStudents()` filters by `window.currentLabId`
- Only shows sessions from current lab
- Real-time updates scoped to lab

#### **Server Socket Management**

**Admin Registration:**
```javascript
socket.on('register-admin', (data) => {
  const adminLabId = data?.labId || detectLabFromIP(adminIP);
  adminLabMap.set(socket.id, adminLabId);
  socket.join(`admins-lab-${adminLabId}`);
})
```

**Kiosk Registration:**
```javascript
socket.on('register-kiosk', ({ sessionId, systemNumber, labId }) => {
  kioskSockets.set(sessionId, socket.id);
  kioskSystemSockets.set(systemNumber, socket.id); // For guest access
  socket.join(`lab-${labId}`);
})
```

**System Number Mapping:**
- `kioskSystemSockets` map: `systemNumber → socket.id`
- Used for guest access to systems before login
- Updated when kiosk connects (`computer-online` event)

#### **API Endpoints**

**All endpoints now support labId:**

1. `/api/start-lab-session`:
   - Detects lab from admin IP or uses provided `labId`
   - Creates lab session scoped to lab
   - Clears old sessions for **this lab only**

2. `/api/end-lab-session`:
   - Ends sessions for **this lab only**
   - Sends `lab-session-ending` to kiosks in **this lab only**

3. `/api/student-login`:
   - Includes `labId` in session creation
   - Sessions filtered by labId

4. Socket `get-active-sessions`:
   - Returns sessions for admin's lab only
   - Includes lab session for admin's lab only

---

## Testing Checklist

### Guest Access Testing:
- [ ] Admin can see "Guest Access" button on connected systems
- [ ] Clicking button shows confirmation dialog
- [ ] After confirmation, kiosk unlocks automatically
- [ ] Guest mode indicator appears on kiosk screen
- [ ] Admin dashboard shows "Guest Mode" badge
- [ ] Guest can use system normally
- [ ] Guest session appears in reports
- [ ] Guest access works for systems before login (if kiosk is running)

### Multi-Lab Testing:
- [ ] Lab selector appears in admin dashboard header
- [ ] Admin can switch between labs
- [ ] Each lab shows only its own systems
- [ ] Two admins in different labs see different systems
- [ ] Lab sessions are isolated (CC1 session doesn't affect CC2)
- [ ] Guest access only works within same lab
- [ ] Shutdown operations scoped to lab
- [ ] Reports filtered by lab
- [ ] IP detection works correctly for kiosks
- [ ] IP detection works correctly for admins

---

## Configuration

### IP Range Mapping

**Kiosk (`main-simple.js`):**
```javascript
const labIPRanges = {
  '10.10.46.': 'CC1',
  '10.10.47.': 'CC2',
  '10.10.48.': 'CC3',
  // ... add more as needed
};
```

**Server (`app.js`):**
```javascript
const labIPRanges = {
  '10.10.46.': 'CC1',
  '10.10.47.': 'CC2',
  // ... same mapping
};
```

### Lab Selector Options

**Admin Dashboard:**
- Currently supports: CC1, CC2, CC3, CC4, CC5
- Add more options in `<select id="labSelector">` as needed

---

## Files Modified

### Kiosk:
- `student-kiosk/desktop-app/main-simple.js`
- `student-kiosk/desktop-app/renderer.js`
- `student-kiosk/desktop-app/preload.js`

### Server:
- `central-admin/server/app.js`

### Admin Dashboard:
- `central-admin/dashboard/admin-dashboard.html`

---

## Notes

1. **Guest Access Password**: Currently uses direct session creation (no password required). The old `guest-access` handler with `admin123` password is kept as fallback but not actively used.

2. **System Number Format**: Should follow pattern `LAB-ID-NUMBER` (e.g., `CC1-01`, `CC2-15`). Lab ID is extracted from system number prefix.

3. **Lab Isolation**: Complete isolation means:
   - No cross-lab session visibility
   - No cross-lab operations
   - No cross-lab notifications
   - Separate lab sessions per lab

4. **Backward Compatibility**: If `labId` is not provided, defaults to `CC1` for backward compatibility.

---

## Future Enhancements

1. **Lab Configuration File**: Store IP ranges and lab names in config file
2. **Lab Admin Permissions**: Restrict which labs an admin can access
3. **Lab Statistics**: Per-lab statistics and reports
4. **Lab Templates**: Pre-configured lab settings
5. **Guest Session Timeout**: Auto-logout guest sessions after X minutes

---

## Status: ✅ COMPLETE

Both features are fully implemented and ready for testing.

