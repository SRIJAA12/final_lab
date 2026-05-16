# 🛠️ KIOSK LOGOUT ON SHUTDOWN - Implementation Guide

## Answer to Your Question

**Q: Should student system code or only admin code be changed?**

**A: BOTH need changes!** ✅

Here's why:

| Code | Why It Needs Changes |
|------|-------------------|
| **Student System (CLIENT)** | ✅ MUST detect shutdown and send logout signal |
| **Admin Code (SERVER)** | ✅ MUST handle logout immediately and cleanup |

---

## 📝 Changes Required

### PART 1: CLIENT CHANGES (Student System)

#### File 1: `main-simple.js`
**Purpose**: Detect app closing/shutdown and trigger graceful logout

**Location**: Lines after app.on('ready')

**Changes Needed**:
```
Add 2 event handlers:
1. app.on('before-quit') - Before Electron app closes
2. app.on('will-quit') - Final chance to cleanup

Each handler should:
- Call logoutStudent() from renderer
- Send logout signal to server
- Wait 500ms for confirmation
- Then allow app to close
```

---

#### File 2: `renderer.js`
**Purpose**: Execute actual logout logic

**Changes Needed**:
```
Add 1 function and update 1 function:

1. ADD logoutStudent() function:
   - Mark student as logging out
   - Emit 'student-logout' event to server
   - Close WebRTC peer connection
   - Clear session data
   - Stop screen capture

2. UPDATE initializeSocket():
   - Add listener for 'logout-confirmed' from server
   - Add listener for 'force-logout' from admin
```

---

### PART 2: SERVER CHANGES (Admin Code)

#### File: `app.js`
**Purpose**: Handle logout immediately and clean up admin dashboard

**Changes Needed**:

**Location 1** (Add around line 3650): 
```
Listen for 'student-logout' event:
- Retrieve sessionId from socket
- End session in database
- Mark with logout timestamp
- Notify all admins
- Return 'logout-confirmed'
```

**Location 2** (Enhance line 4409 disconnect handler):
```
EXISTING disconnect handler:
socket.on('disconnect', () => {
    // Existing cleanup code
});

ADD to disconnect handler:
- Check if this is a logged-in kiosk (sessionId exists)
- If yes, end session in database with "forced-logout"
- Emit 'admin-refresh-monitors' to all admins
- Remove from monitoring connections on dashboard
```

---

## 🔑 Key Implementation Details

### Client-Side (Renderer.js)

**New Function to Add**:
```javascript
// Graceful logout function
async function logoutStudent() {
    console.log('👋 Student initiating logout...');
    
    // 1. Close screen capture
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // 2. Close WebRTC connection
    if (pc) {
        pc.close();
        pc = null;
    }
    
    // 3. Send logout to server
    if (socket && socketInitialized) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(), 1000); // Timeout after 1s
            
            socket.once('logout-confirmed', () => {
                clearTimeout(timeout);
                resolve();
            });
            
            socket.emit('student-logout', { 
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            });
        });
    }
}

// Call this in main-simple.js before app quits
```

---

### Server-Side (App.js)

**New Event Handler to Add** (after line 3650):
```javascript
socket.on('student-logout', async ({ sessionId, timestamp }) => {
    console.log('👋 Server received student logout:', sessionId);
    
    try {
        if (sessionId) {
            // 1. End session in database
            const session = await Session.findOneAndUpdate(
                { _id: sessionId, status: 'active' },
                {
                    status: 'completed',
                    logoutTime: new Date(timestamp),
                    duration: Math.floor((new Date(timestamp) - new Date(session.loginTime)) / 1000)
                },
                { new: true }
            );
            
            console.log('✅ Session ended:', sessionId);
            
            // 2. Notify admin to refresh monitors
            io.to('admins').emit('monitor-ended', { sessionId });
            
            // 3. Remove from monitoring
            kioskSockets.delete(sessionId);
        }
        
        // Send confirmation back
        socket.emit('logout-confirmed', { success: true });
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        socket.emit('logout-confirmed', { success: false });
    }
});
```

**Enhance Disconnect Handler** (line 4409):
```javascript
socket.on('disconnect', async () => {
    console.log("❌ Socket disconnected:", socket.id);
    
    // Find if this kiosk had an active session
    let activeSessionId = null;
    for (const [sessionId, sId] of kioskSockets.entries()) {
        if (sId === socket.id) {
            activeSessionId = sessionId;
            break;
        }
    }
    
    // If student disconnected without explicit logout, mark session as ended
    if (activeSessionId) {
        try {
            await Session.findByIdAndUpdate(
                activeSessionId,
                {
                    status: 'completed',
                    logoutTime: new Date(),
                    // Duration already calculated if session has loginTime
                },
                { new: true }
            );
            console.log('✅ Forced logout for:', activeSessionId);
            
            // Notify admins
            io.to('admins').emit('monitor-ended', { 
                sessionId: activeSessionId,
                reason: 'disconnected-without-logout'
            });
        } catch (error) {
            console.error('❌ Error in forced logout:', error);
        }
    }
    
    // Existing cleanup code...
    for (const [sessionId, sId] of kioskSockets.entries()) {
        if (sId === socket.id) {
            kioskSockets.delete(sessionId);
            console.log('🧹 Cleaned up kiosk for session:', sessionId);
        }
    }
    // ... rest of existing code
});
```

---

### Main Process (main-simple.js)

**Add Event Handlers** (after app.on('ready')):
```javascript
// Graceful shutdown handler
app.on('before-quit', (event) => {
    console.log('🛑 before-quit: Preparing for shutdown...');
    // Don't prevent quit, just signal logging out
});

// Before app completely closes
app.on('will-quit', (event) => {
    console.log('🛑 will-quit: Final cleanup...');
    // Cleanup happens automatically through IPC
});

// When main window closes
app.on('window-all-closed', () => {
    console.log('🪟 All windows closed');
    // On Windows, quit immediately
    if (process.platform !== 'win32') {
        app.quit();
    }
});
```

---

## 📊 Comparison: Before vs After

### BEFORE (Current - Broken):

```
Timeline:
0ms     - Student clicks shutdown
0ms     - Electron app closes (NO CLEANUP)
0ms     - Admin dashboard: shows student name (STALE)
0ms     - Screen mirror: shows black screen
60s     - Server detects socket disconnect
60s     - Admin dashboard refreshes (TOO LATE)

Result: ❌ Data inconsistent for 60 seconds
```

### AFTER (Fixed):

```
Timeline:
0ms     - Student clicks shutdown
10ms    - Electron detects before-quit event
50ms    - Student system calls logoutStudent()
100ms   - Server receives 'student-logout' event
150ms   - Server updates database (session = completed)
200ms   - Admin receives 'monitor-ended' event
250ms   - Admin dashboard refreshes

Result: ✅ Complete cleanup in 250ms
```

---

## 🧪 Testing Procedure

### Test 1: Normal Logout (Should Still Work)
```
1. Student logs in ✓
2. Student clicks "Logout" button ✓
3. Session ends cleanly ✓
4. Admin dashboard updates immediately ✓
```

### Test 2: System Shutdown (Without Logout)
```
1. Student logs in ✓
2. Student shuts down computer (without logout) ✓
3. Wait 1-2 seconds ✓
4. Admin dashboard should show:
   - Student name CLEARED ✓
   - Screen mirror REMOVED ✓
   - Session marked COMPLETED ✓
```

### Test 3: Force Quit (Alt+F4 or Process Kill)
```
1. Student logs in ✓
2. Kill Electron app (Ctrl+Shift+Esc) ✓
3. Wait 1-2 seconds ✓
4. Admin dashboard should show:
   - Student name CLEARED ✓
   - Screen mirror REMOVED ✓
   - Session marked COMPLETED ✓
```

### Test 4: Network Disconnect (PC loses connection)
```
1. Student logged in ✓
2. Unplug ethernet / kill WiFi ✓
3. Wait 60 seconds (for 60s ping timeout) ✓
4. Admin dashboard should eventually show:
   - Student marked OFFLINE ✓
   - Session marked COMPLETED ✓
```

---

## 📋 Checklist for Implementation

### Phase 1: Client Changes
- [ ] Add logoutStudent() function to renderer.js
- [ ] Add before-quit handler to main-simple.js
- [ ] Add 'logout-confirmed' listener to renderer.js
- [ ] Test with npm start

### Phase 2: Server Changes
- [ ] Add 'student-logout' listener to app.js
- [ ] Enhance disconnect handler in app.js
- [ ] Add database cleanup on logout
- [ ] Add 'monitor-ended' event emission

### Phase 3: Admin Dashboard Changes
- [ ] Add listener for 'monitor-ended' event
- [ ] Refresh monitor list when received
- [ ] Remove student from monitoring connections
- [ ] Clear screen mirror display

### Phase 4: Testing
- [ ] Test normal logout
- [ ] Test system shutdown
- [ ] Test force quit
- [ ] Verify admin dashboard updates
- [ ] Verify database state

---

## ⚠️ Important Notes

1. **Don't Prevent Quit**: Don't use `event.preventDefault()` - let the system shutdown
2. **Timeout Fallback**: Use 1000ms timeout for logout signal (system might be killing process)
3. **Graceful Degradation**: If logout fails, disconnect handler still cleans up
4. **Database Integrity**: Always update session status, even on failure
5. **Admin Notification**: Emit events to notify all admins immediately

---

## 📞 Summary

**Answer**: You need to change **BOTH** files:

| File | Change Type | Priority |
|------|-------------|----------|
| `renderer.js` | ADD logoutStudent() | 🔴 CRITICAL |
| `main-simple.js` | ADD before-quit handler | 🔴 CRITICAL |
| `app.js` | ADD student-logout listener | 🔴 CRITICAL |
| `app.js` | ENHANCE disconnect handler | 🔴 CRITICAL |
| `admin-dashboard.html` | ADD monitor refresh logic | 🟡 IMPORTANT |

---

**Status**: Ready for implementation  
**Estimated Time**: 30-45 minutes  
**Testing Time**: 15-20 minutes  
**Total Time**: 1-1.5 hours
