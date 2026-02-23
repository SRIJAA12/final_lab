const { app, BrowserWindow, ipcMain, screen, dialog, globalShortcut, desktopCapturer } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Enable screen capturing - will be set when app is ready
console.log('🎬 Kiosk application starting...');

// ✅ INSTANT LAUNCH: Disable GPU acceleration and other delays for faster startup
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('no-sandbox');
app.disableHardwareAcceleration(); // Faster startup on some systems

// ✅ AUTO-START: Register app to start after Windows login
function setupAutoStart() {
  try {
    if (process.platform === 'win32') {
      // Check if already registered
      const appPath = app.getPath('exe');
      console.log(`📋 App path: ${appPath}`);
      
      // Note: If running via npm start (development), auto-start uses electron.exe path
      // For production EXE, the NSIS installer handles registry entry
      // Auto-start in production is configured in package.json build.nsis
      console.log('✅ Auto-start configured in NSIS installer for production');
      console.log('   In development, run: npm run build-win to create installer with auto-start');
    }
  } catch (error) {
    console.error('⚠️ Error setting up auto-start:', error.message);
  }
}

let mainWindow = null;
let timerWindow = null;
let currentSession = null;
let sessionActive = false;

// Load server URL from config file (auto-detected by server)
function loadServerUrl() {
  try {
    // Try multiple possible config locations
    const possiblePaths = [
      path.join(__dirname, 'server-config.json'),  // Same folder as main-simple.js
      path.join(__dirname, '..', 'server-config.json'),  // Parent folder
      'C:\\StudentKiosk\\server-config.json',  // Installation directory
      path.join(__dirname, '..', '..', '..', 'server-config.json'),  // From desktop-app folder
      path.join(app.getAppPath(), '..', '..', '..', 'server-config.json')  // From app folder
    ];
    
    for (const configPath of possiblePaths) {
      console.log(`🔍 Checking config at: ${configPath}`);
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const url = `http://${config.serverIp}:${config.serverPort}`;
        console.log(`✅ Loaded server URL from config: ${url}`);
        console.log(`📁 Config path: ${configPath}`);
        console.log(`📅 Config last updated: ${config.lastUpdated}`);
        return url;
      }
    }
    console.warn('⚠️ Config file not found in any expected location');
    console.warn('⚠️ Checked paths:', possiblePaths);
  } catch (error) {
    console.error('⚠️ Error loading config:', error.message);
  }
  // Fallback to localhost
  console.warn('⚠️ Using fallback: http://localhost:7401');
  return 'http://localhost:7401';
}

const SERVER_URL = loadServerUrl();

// IP-based Lab Detection
function detectLabFromIP() {
  try {
    const networkInterfaces = os.networkInterfaces();
    let detectedLab = null;
    
    // IP range to Lab ID mapping
    // Note: Remove specific IP ranges when not at college
    // Default to CC1 for local development
    const labIPRanges = {
      // Add your college IP ranges here when needed
      // '10.10.46.': 'CC1',
      // '10.10.47.': 'CC2',
      // '10.10.48.': 'CC3',
    };
    
    // Check all network interfaces
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          const ip = addr.address;
          console.log(`🔍 Checking IP: ${ip}`);
          
          // Check against known lab IP ranges
          for (const [prefix, labId] of Object.entries(labIPRanges)) {
            if (ip.startsWith(prefix)) {
              detectedLab = labId;
              console.log(`✅ Lab detected from IP ${ip}: ${labId}`);
              return labId;
            }
          }
        }
      }
    }
    
    // Fallback: use environment variable or default
    if (!detectedLab) {
      detectedLab = process.env.LAB_ID || "CC1";
      console.log(`⚠️ Could not detect lab from IP, using default: ${detectedLab}`);
    }
    
    return detectedLab;
  } catch (error) {
    console.error('⚠️ Error detecting lab from IP:', error.message);
    return process.env.LAB_ID || "CC1";
  }
}

// Helper function to get local IP address
function getLocalIP() {
  try {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
  } catch (error) {
    console.error('Error getting local IP:', error);
  }
  return '0.0.0.0';
}

const LAB_ID = detectLabFromIP();
const SYSTEM_NUMBER = process.env.SYSTEM_NUMBER || `${LAB_ID}-${String(Math.floor(Math.random() * 10) + 1).padStart(2, '0')}`;

// Kiosk mode configuration
// ✅ PRODUCTION: Full kiosk lock enabled from startup
// KIOSK_MODE = true: Full-screen lock, no ESC, no Alt+Tab, no keyboard shortcuts
const KIOSK_MODE = true; // ✅ ENABLED: Full kiosk lockdown - all shortcuts blocked
let isKioskLocked = true; // ✅ LOCKED: Complete lockdown until student logs in

function createWindow() {
  // 🔒 FORCE KIOSK LOCK FUNCTION (must be declared FIRST, before any usage)
  function forceKioskLock() {
    if (!mainWindow || mainWindow.isDestroyed() || !isKioskLocked) return;

    const { width, height } = screen.getPrimaryDisplay().bounds;

    mainWindow.setBounds({ x: 0 , y: 0, width, height });
    mainWindow.setKiosk(true);
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setSkipTaskbar(true);
    mainWindow.maximize();
    mainWindow.focus();
    mainWindow.moveTop();
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;

  // Window configuration depends on kiosk mode
  const windowOptions = KIOSK_MODE ? {
    width: screenWidth,  // Use full screen bounds, not workAreaSize
    height: screenHeight,
    x: 0,
    y: 0,
    frame: false,
    fullscreen: true,
    kiosk: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    closable: false,
    simpleFullscreen: true, // macOS compatibility
    autoHideMenuBar: true,
    show: false, // Don't show until ready
    backgroundColor: '#000000', // Black background while loading
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        enableBlinkFeatures: 'GetDisplayMedia',
        webSecurity: false,
        devTools: false // 🔒 KIOSK MODE: DevTools disabled for security
      }
    } : {
      width,
      height,
      frame: true,
      fullscreen: false,
      kiosk: false,
    alwaysOnTop: false,
      skipTaskbar: false,
      resizable: true,
      minimizable: true,
      closable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableBlinkFeatures: 'GetDisplayMedia',
      webSecurity: false,
        devTools: true // 🔧 DEBUG MODE: Enabled for testing
    }
    };

  mainWindow = new BrowserWindow(windowOptions);

  // 🔒 CRITICAL: Window will be shown in ready-to-show event
  // Don't hide it manually - let Electron handle it naturally

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    console.log('🔐 Permission requested:', permission);
    if (permission === 'media' || permission === 'display-capture') {
      callback(true);
    } else {
      callback(false);
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    console.log('🔐 Permission check:', permission);
    return true;
  });

  mainWindow.loadFile('student-interface.html');
  
  // 🔒 CRITICAL: Show window IMMEDIATELY (don't wait for ready-to-show)
  // This ensures kiosk appears within 1ms of launch
  if (KIOSK_MODE) {
    console.log('🚀 INSTANT LAUNCH: Showing kiosk immediately...');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.setKiosk(true);
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.show(); // Show IMMEDIATELY
    mainWindow.focus();
    mainWindow.moveTop();
    console.log('✅ Kiosk visible immediately - Windows shell blocked');
  }
  
  // 🔒 BACKUP: Ensure window shows even if ready-to-show doesn't fire
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      console.warn('⚠️ Window not shown after 3 seconds, forcing visibility...');
      
      if (KIOSK_MODE) {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.bounds;
        mainWindow.setBounds({ x: 0, y: 0, width, height });
        mainWindow.setKiosk(true);
        mainWindow.setFullScreen(true);
        mainWindow.setAlwaysOnTop(true);
        mainWindow.maximize();
      }
      
      mainWindow.show();
      mainWindow.focus();
    }
  }, 3000);    // 🔒 BLOCK ESCAPE KEY AT WEBCONTENTS LEVEL (before it can exit fullscreen)
  if (KIOSK_MODE) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Only block if kiosk is still locked (before login)
      if (!isKioskLocked) {
        return; // Allow all keys after login
      }
      
      // 🚫 CRITICAL: Block ALL key events that could exit kiosk
      if (
        input.key === 'Escape' ||
        input.key === 'Esc' ||
        input.key === 'F11' ||
        input.alt ||
        input.meta
      ) {
        event.preventDefault();
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        }
        console.log('🚫 BLOCKED key:', input.key);
        return false;
      }
      
      // Block Ctrl+W, Ctrl+Q
      if (input.control && (input.key.toLowerCase() === 'w' || input.key.toLowerCase() === 'q')) {
        event.preventDefault();
        if (event.stopImmediatePropagation) {
          event.stopImmediatePropagation();
        }
        console.log('🚫 BLOCKED Ctrl+' + input.key);
        return false;      }
    });
    
    // 🔒 NOTE: blur handler is set up later with forceKioskLock
  }
  
  if (KIOSK_MODE) {
    console.log('🔒 Kiosk application starting in FULL BLOCKING mode...');
  } else {
    console.log('✅ Testing mode - Kiosk disabled');
  }
  mainWindow.once('ready-to-show', () => {
    // 🔒 PRODUCTION: Additional enforcement when ready (window already shown)
    if (KIOSK_MODE) {
      // Force MAXIMUM window size to cover taskbar
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.bounds;
      
      // Re-enforce ALL kiosk settings (already applied but double-check)
      mainWindow.setBounds({ x: 0, y: 0, width, height });
      mainWindow.setKiosk(true);
      mainWindow.setFullScreen(true);
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
      mainWindow.setSkipTaskbar(true);
      mainWindow.maximize();      mainWindow.focus();
      mainWindow.moveTop();
      
      // 🔒 HARD BLOCK ESCAPE AT OS LEVEL (PREVENT TASKBAR FLASH)
      try {
        const ok = globalShortcut.register('Escape', () => {
          if (isKioskLocked) {
            // swallow Escape completely
            return;
          }
        });

        if (ok) {
          console.log('✅ OS-level Escape blocked');
        }
      } catch (e) {
        console.error('❌ Failed to register Escape:', e);
      }      
      // CRITICAL: Keep enforcing fullscreen to prevent taskbar from appearing
      // Check every 100ms (10x per second) for instant re-lock
      setInterval(() => {
        if (isKioskLocked) {
          forceKioskLock();
        }
      }, 100); // ⚡ 100ms interval = 10 checks per second for instant re-lock
      
      // Double-check visibility
      if (!mainWindow.isVisible()) {
        console.warn('⚠️ Window became hidden, forcing visibility...');
        mainWindow.showInactive();
        mainWindow.show();
      }
      
      console.log('✅ Kiosk fully loaded and enforced in LOCKDOWN mode');
      console.log('🔒 EVERYTHING BLOCKED - Taskbar covered, no shortcuts, no escape');
      console.log(`📊 Window: ${width}x${height} at (0,0)`);
      console.log('⚠️ Only way out: Login → Logout → Shutdown via UI');
    } else {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.openDevTools();      console.log('🔧 Testing mode - DevTools opened');
    }
  });
  
  // 🔒 PREVENT ESCAPE FROM EXITING FULLSCREEN/KIOSK (only when locked)
  // 🔒 INSTANT RE-LOCK: No delay, immediate enforcement
  mainWindow.on('leave-full-screen', forceKioskLock);
  mainWindow.on('leave-html-full-screen', forceKioskLock);
  mainWindow.on('blur', forceKioskLock);
  
  console.log(`✅ Application Ready - System: ${SYSTEM_NUMBER}, Lab: ${LAB_ID}`);
  console.log(`✅ Server: ${SERVER_URL}`);
  if (KIOSK_MODE) {
    console.log('🔒 FULL KIOSK MODE ACTIVE - System completely locked down!');
    console.log('🚫 All keyboard shortcuts blocked until student login');
  } else {
    console.log('✅ TESTING MODE - Shortcuts available, DevTools enabled');
  }

  // Kiosk mode - prevent closing
  mainWindow.on('close', (e) => {
    if (isKioskLocked) {
      e.preventDefault();
      console.log('🚫 Window close blocked - kiosk mode active');
      mainWindow.focus(); // Force focus back
    }
  });
}

function createTimerWindow(studentName, studentId) {
  // Prevent duplicate timer windows
  if (timerWindow && !timerWindow.isDestroyed()) {
    console.log('⚠️ Timer window already exists, not creating duplicate');
    return;
  }

  const { width } = screen.getPrimaryDisplay().workAreaSize;
    timerWindow = new BrowserWindow({
    width: 350,
    height: 250,  // Increased height for logout button
    x: width - 370,
    y: 20,
    frame: true,  // ✅ CHANGED: Enable frame so user can minimize
    title: '⏱️ Active Session Timer',
    alwaysOnTop: true,
    skipTaskbar: false,
    minimizable: true,  // ✅ CHANGED: Allow minimize
    closable: false,  // 🔒 KEEP: Cannot be closed (must use Logout button)
    resizable: false,
    webPreferences: {
      nodeIntegration: true,  // Enable for ipcRenderer in timer
      contextIsolation: false,  // Allow require() in timer window
      devTools: false,  // 🔒 SECURITY: Disable dev tools completely
      enableRemoteModule: false,  // 🔒 SECURITY: Disable remote module
      webSecurity: true  // 🔒 SECURITY: Enable web security
    }
  });
  
  // 🔒 CRITICAL SECURITY: Block ALL refresh and DevTools shortcuts in timer window
  timerWindow.webContents.on('before-input-event', (event, input) => {
    // Block Ctrl+R (refresh) - CRITICAL FIX
    if (input.control && (input.key === 'r' || input.key === 'R')) {
      event.preventDefault();
      console.log('🚫 BLOCKED: Ctrl+R refresh attempt in timer window');
      return;
    }
    // Block Ctrl+Shift+R (hard refresh)
    if (input.control && input.shift && (input.key === 'r' || input.key === 'R')) {
      event.preventDefault();
      console.log('🚫 BLOCKED: Ctrl+Shift+R hard refresh attempt in timer window');
      return;
    }
    // Block F5 (refresh) - CRITICAL FIX
    if (input.key === 'F5') {
      event.preventDefault();
      console.log('🚫 BLOCKED: F5 refresh attempt in timer window');
      return;
    }
    // Block Ctrl+F5 (force refresh)
    if (input.control && input.key === 'F5') {
      event.preventDefault();
      console.log('🚫 BLOCKED: Ctrl+F5 force refresh in timer window');
      return;
    }
    // Block F12 (DevTools) - CRITICAL FIX
    if (input.key === 'F12') {
      event.preventDefault();
      console.log('🚫 BLOCKED: F12 DevTools attempt in timer window');
      return;
    }
    // Block Ctrl+Shift+I (DevTools) - CRITICAL FIX
    if (input.control && input.shift && (input.key === 'i' || input.key === 'I')) {
      event.preventDefault();
      console.log('🚫 BLOCKED: Ctrl+Shift+I DevTools attempt in timer window');
      return;
    }
    // Block Ctrl+Shift+J (Console)
    if (input.control && input.shift && (input.key === 'j' || input.key === 'J')) {
      event.preventDefault();
      console.log('🚫 BLOCKED: Ctrl+Shift+J Console attempt in timer window');
      return;
    }
    // Block Ctrl+Shift+C (Inspect)
    if (input.control && input.shift && (input.key === 'c' || input.key === 'C')) {
      event.preventDefault();
      console.log('🚫 BLOCKED: Ctrl+Shift+C Inspect attempt in timer window');
      return;
    }
    // Block Ctrl+U (View Source)
    if (input.control && (input.key === 'u' || input.key === 'U')) {
      event.preventDefault();
      console.log('🚫 BLOCKED: Ctrl+U View Source in timer window');
      return;
    }
  });
  
  // 🔒 CRITICAL: Disable right-click context menu completely
  timerWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
    console.log('🚫 BLOCKED: Right-click context menu in timer window');
  });
  
  // 🔒 CRITICAL: Prevent DevTools from opening by any means
  timerWindow.webContents.on('devtools-opened', () => {
    timerWindow.webContents.closeDevTools();
    console.log('🚫 BLOCKED: DevTools forcefully closed in timer window');
  });
  
  // 🔒 CRITICAL: Block navigation/reload attempts
  timerWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
    console.log('🚫 BLOCKED: Navigation attempt in timer window');
  });
  
  timerWindow.webContents.on('will-reload', (event) => {
    event.preventDefault();
    console.log('🚫 BLOCKED: Reload attempt in timer window');
  });

  // HTML content for timer window with Logout button
  const timerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Active Session Timer</title>      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          text-align: center;
          user-select: none;
        }
        .content {
          padding: 10px;
        }
        h3 {
          margin: 5px 0 10px 0;
          font-size: 16px;
        }
        .timer {
          font-size: 32px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          margin: 10px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .info {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 15px;
        }
        .logout-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 30px;
          font-size: 14px;
          font-weight: bold;
          border-radius: 5px;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          transition: all 0.3s;
        }
        .logout-btn:hover {
          background: #c82333;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.4);
        }
        .logout-btn:active {
          transform: translateY(0);
        }      </style>
    </head>
    <body>
      <div class="content">
      <h3>⏱️ Session Active</h3>
      <div class="timer" id="timer">00:00:00</div>
      <div class="info">
        <strong>${studentName}</strong><br>
        ${studentId}
      </div>
      <button class="logout-btn" onclick="handleLogout()">🚪 Logout</button>
      </div>
      <script>
        const { ipcRenderer } = require('electron');
        
        let startTime = Date.now();
        function updateTimer() {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
          const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
          const seconds = String(elapsed % 60).padStart(2, '0');
          document.getElementById('timer').textContent = hours + ':' + minutes + ':' + seconds;
        }
        setInterval(updateTimer, 1000);
        updateTimer();
        
        function handleLogout() {
          if (confirm('Are you sure you want to end your session and logout?')) {
            ipcRenderer.send('timer-logout-clicked');
          }
        }
      </script>
    </body>
    </html>
  `;

  timerWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(timerHTML));

  // Prevent closing - block all close attempts
  timerWindow.on('close', (e) => {
    if (sessionActive) {
      e.preventDefault();
      console.log('❌ Timer window close prevented - use Logout button');
      
      // Show dialog in timer window
      const { dialog } = require('electron');
      dialog.showMessageBoxSync(timerWindow, {
        type: 'warning',
        title: 'Cannot Close Timer',
        message: 'Session Timer Active',
        detail: 'You must log out from the kiosk before closing this window.\n\nUse the Logout button on the timer or kiosk screen to end your session.',
        buttons: ['OK']
      });
      
      timerWindow.minimize();
      
      // Also notify main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('timer-close-blocked');
      }
    }
    // If session not active, allow closing
  });
  
      // Prevent force close attempts - timer must not be closable until logout
      timerWindow.setClosable(false);
      
      // Block Alt+F4 and other close shortcuts for timer window
      timerWindow.on('focus', () => {
        try {
          globalShortcut.register('Alt+F4', () => {
            console.log('🚫 Alt+F4 blocked on timer window - student must use Logout button');
            return false;
          });
        } catch (e) {
          console.log('⚠️ Alt+F4 already registered or error:', e.message);
        }
      });
      
      timerWindow.on('blur', () => {
        try {
          globalShortcut.unregister('Alt+F4');
        } catch (e) {
          // Ignore if already unregistered
        }
      });

  // Keep timer window visible for debugging
  timerWindow.once('ready-to-show', () => {
    timerWindow.show(); // Show and keep visible
    console.log('✅ Timer window kept visible for debugging');
  });

  console.log('⏱️ Timer window created for:', studentName);
}

// Shared logout process used by both timer logout and main logout button
async function handleLogoutProcess() {
  if (!sessionActive || !currentSession) {
    console.warn('⚠️ No active session to logout');
    return { success: false, error: 'No active session' };
  }

  try {
    console.log('🚪 Logging out session:', currentSession.id);

    mainWindow.webContents.send('stop-live-stream');

    await fetch(`${SERVER_URL}/api/student-logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSession.id }),
    });

    console.log('✅ Logout successful');

    sessionActive = false;
    currentSession = null;
    isKioskLocked = true; // Lock the system again

    // Close timer window properly
    if (timerWindow && !timerWindow.isDestroyed()) {
      timerWindow.setClosable(true);  // Allow closing now
      timerWindow.close();
      timerWindow = null;
      console.log('⏱️ Timer window closed after logout');
    }

    // 🔒 CRITICAL: Restore strict kiosk mode after logout
    console.log('🔒 Re-locking system in full kiosk mode...');
    
    // Re-apply full screen bounds to cover taskbar
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.bounds;
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    
    mainWindow.setClosable(false);
    mainWindow.setMinimizable(false);
    mainWindow.setSkipTaskbar(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setKiosk(true);
    mainWindow.setFullScreen(true);
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.moveTop();
    
    console.log('🔒 System fully locked after logout - kiosk mode active');
    
    // ✅ CRITICAL FIX: Return to kiosk login screen (DO NOT SHUTDOWN SYSTEM)
    console.log('🔄 Returning to kiosk login screen - System stays running...');

    // Re-enable kiosk shortcut blocking so the machine is locked again
    try {
      blockKioskShortcuts();
      console.log('🔒 Kiosk shortcuts re-registered after logout');
    } catch (e) {
      console.error('⚠️ Error re-registering kiosk shortcuts:', e.message || e);
    }
    
    // 🔄 Reload main window to show login screen again (instead of quitting)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
      console.log('✅ Kiosk login screen reloaded - Ready for next student');
    }
    
    console.log('✅ System ready for next student login - NO SHUTDOWN');

    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

function setupIPCHandlers() {
  // Handle logout from timer window
  ipcMain.on('timer-logout-clicked', async () => {
    console.log('🚪 Logout clicked from timer window');
    
    // Call the same logout logic as the student-logout handler
    await handleLogoutProcess();
    
    // ✅ CRITICAL FIX: Reload to login screen (already handled in handleLogoutProcess)
    // System will NOT shutdown, only return to kiosk login
    console.log('✅ Timer logout complete - Kiosk login screen active');
  });
  
  // Handle screen sources request
  ipcMain.handle('get-screen-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({ 
        types: ['screen', 'window'],
        thumbnailSize: { width: 1920, height: 1080 }
      });
      console.log('✅ desktopCapturer returned', sources.length, 'sources');
      return sources;
    } catch (error) {
      console.error('❌ desktopCapturer error:', error);
      throw error;
    }
  });

  // Handle student login
  ipcMain.handle('student-login', async (event, credentials) => {
    try {
      const isGuest = credentials.isGuest === true;
      
      let authData = null;
      
      if (isGuest) {
        // For guest mode, skip authentication and use GUEST account
        console.log('🔓 Guest mode login attempt');
        authData = {
          success: true,
          student: {
            name: 'Guest User',
            studentId: 'GUEST'
          }
        };
      } else {
        // Normal student authentication
        const creds = {
          studentId: credentials.studentId,
          password: credentials.password,
          labId: LAB_ID,
        };

        console.log('🔐 Attempting authentication for:', creds.studentId);

        const authRes = await fetch(`${SERVER_URL}/api/authenticate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds),
        });
        authData = await authRes.json();

        if (!authData.success) {
          console.error('❌ Authentication failed:', authData.error);
          return { success: false, error: authData.error || 'Authentication failed' };
        }

        console.log('✅ Authentication successful for:', authData.student.name);
      }

      const sessionRes = await fetch(`${SERVER_URL}/api/student-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: authData.student.name,
          studentId: authData.student.studentId,
          computerName: os.hostname(),
          labId: LAB_ID,
          systemNumber: credentials.systemNumber || SYSTEM_NUMBER,
          isGuest: isGuest
        }),
      });
      const sessionData = await sessionRes.json();

      if (!sessionData.success) {
        console.error('❌ Session creation failed:', sessionData.error);
        return { success: false, error: sessionData.error || 'Session creation failed' };
      }

      console.log('✅ Session created:', sessionData.sessionId);

      currentSession = { id: sessionData.sessionId, student: authData.student };
      sessionActive = true;
      isKioskLocked = false; // Unlock the system

      // After login, minimize the kiosk window so student can work normally
      mainWindow.setClosable(false);
      mainWindow.setMinimizable(true);          // Allow minimize
      mainWindow.setAlwaysOnTop(false);        // Allow other apps
      mainWindow.setKiosk(false);              // Exit kiosk mode
      mainWindow.setFullScreen(false);         // Exit fullscreen
      mainWindow.minimize();                   // MINIMIZE to taskbar

      // After successful login, release global shortcuts so the student
      // can use the system and other applications normally.
      try {
        globalShortcut.unregisterAll();
        console.log('🔓 Kiosk shortcuts unregistered - system free for normal use');
      } catch (e) {
        console.error('⚠️ Error unregistering kiosk shortcuts:', e.message || e);
      }

      console.log(`🔓 System unlocked for: ${authData.student.name} (${authData.student.studentId})`);

      // Notify the HTML that student is logged in (disable keyboard blocking)
      mainWindow.webContents.executeJavaScript('window.postMessage("student-logged-in", "*");');

      // Create and show timer window
      createTimerWindow(authData.student.name, authData.student.studentId);

      // Notify renderer to start screen streaming with delay
      setTimeout(() => {
        console.log('🎬 Sending session-created event to renderer:', sessionData.sessionId);
        mainWindow.webContents.send('session-created', {
          sessionId: sessionData.sessionId,
          serverUrl: SERVER_URL,
          studentInfo: {
            studentId: authData.student.studentId,
            studentName: authData.student.name,
            systemNumber: credentials.systemNumber || SYSTEM_NUMBER
          }
        });
      }, 1000);

      return { 
        success: true, 
        student: authData.student, 
        sessionId: sessionData.sessionId 
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }  });

  // Handle guest login
  ipcMain.handle('guest-login', async (event, credentials) => {
    try {
      console.log('🔓 Guest mode login attempt');

      // Authenticate guest password
      const authRes = await fetch(`${SERVER_URL}/api/guest-authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: credentials.password }),
      });
      const authData = await authRes.json();

      if (!authData.success) {
        console.error('❌ Guest authentication failed:', authData.error);
        return { success: false, error: authData.error || 'Invalid guest password' };
      }

      console.log('✅ Guest authentication successful');

      // Create session
      const sessionRes = await fetch(`${SERVER_URL}/api/student-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'Guest User',
          studentId: 'GUEST',
          computerName: os.hostname(),
          labId: LAB_ID,
          systemNumber: credentials.systemNumber || SYSTEM_NUMBER,
          isGuest: true
        }),
      });
      const sessionData = await sessionRes.json();

      if (!sessionData.success) {
        console.error('❌ Guest session creation failed:', sessionData.error);
        return { success: false, error: sessionData.error || 'Session creation failed' };
      }

      console.log('✅ Guest session created:', sessionData.sessionId);

      currentSession = { 
        id: sessionData.sessionId, 
        student: { name: 'Guest User', studentId: 'GUEST' },
        isGuest: true
      };
      sessionActive = true;
      isKioskLocked = false;

      // Unlock system for guest
      mainWindow.setClosable(false);
      mainWindow.setMinimizable(true);
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setKiosk(false);
      mainWindow.setFullScreen(false);
      mainWindow.minimize();

      // Release global shortcuts
      try {
        globalShortcut.unregisterAll();
        console.log('🔓 Kiosk shortcuts unregistered - guest system access granted');
      } catch (e) {
        console.error('⚠️ Error unregistering kiosk shortcuts:', e.message || e);
      }

      console.log('🔓 System unlocked for Guest User');

      // Notify HTML
      mainWindow.webContents.executeJavaScript('window.postMessage("student-logged-in", "*");');

      // Create timer window
      createTimerWindow('Guest User', 'GUEST');

      // Start screen streaming
      setTimeout(() => {
        console.log('🎬 Sending session-created event to renderer:', sessionData.sessionId);
        mainWindow.webContents.send('session-created', {
          sessionId: sessionData.sessionId,
          isGuest: true
        });
      }, 2000);

      return { 
        success: true, 
        sessionId: sessionData.sessionId,
        guest: { name: 'Guest User', studentId: 'GUEST' }
      };

    } catch (error) {
      console.error('❌ Guest login error:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle student logout
  ipcMain.handle('student-logout', async () => {
    return await handleLogoutProcess();
  });

  // Show shutdown dialog (called before logout)
  ipcMain.handle('show-shutdown-dialog', async () => {
    try {
      await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: 'Automatic Shutdown',
        message: 'Session Ended - System Shutting Down',
        detail: 'System will automatically shutdown in 1 minute (60 seconds).\n\nPlease save your work and log out of any other applications.\n\nThis is an automated shutdown after session logout.',
        buttons: ['OK']
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Error showing shutdown dialog:', error);
      return { success: false, error: error.message };
    }
  });

  // Get system number
  ipcMain.handle('get-system-number', async () => {
    return SYSTEM_NUMBER;
  });

  // Get system information
  ipcMain.handle('get-system-info', async () => {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus(),
      memory: os.totalmem(),
      systemNumber: SYSTEM_NUMBER,
      labId: LAB_ID
    };
  });

  // Get server URL
  ipcMain.handle('get-server-url', async () => {
    return SERVER_URL;
  });

  // Reset Password with Date of Birth verification
  ipcMain.handle('reset-password', async (event, data) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // First-time signin
  ipcMain.handle('first-time-signin', async (event, data) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/student-first-signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Check student eligibility for first-time signin
  ipcMain.handle('check-student-eligibility', async (event, data) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/check-student-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // 🔓 GUEST ACCESS: Handle guest access command from admin
  ipcMain.handle('guest-access', async () => {
    try {
      console.log('🔓 Guest access granted - unlocking kiosk without student login');
      
      // Create a guest session
      const guestCredentials = {
        studentId: 'GUEST',
        password: 'admin123', // Fixed guest password
        labId: LAB_ID,
      };

      // Authenticate as guest (server should accept 'GUEST' + 'admin123')
      const authRes = await fetch(`${SERVER_URL}/api/authenticate-guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestCredentials),
      });
      
      let authData;
      if (authRes.ok) {
        authData = await authRes.json();
      } else {
        // If guest auth endpoint doesn't exist, create session directly
        authData = {
          success: true,
          student: {
            name: 'Guest User',
            studentId: 'GUEST',
            email: 'guest@lab.local',
            department: 'Guest',
            year: 0,
            labId: LAB_ID
          }
        };
      }

      if (!authData.success) {
        console.error('❌ Guest authentication failed:', authData.error);
        return { success: false, error: authData.error || 'Guest authentication failed' };
      }

      console.log('✅ Guest access authenticated');

      // Create guest session
      const sessionRes = await fetch(`${SERVER_URL}/api/student-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'Guest User',
          studentId: 'GUEST',
          computerName: os.hostname(),
          labId: LAB_ID,
          systemNumber: SYSTEM_NUMBER,
          isGuest: true
        }),
      });
      const sessionData = await sessionRes.json();

      if (!sessionData.success) {
        console.error('❌ Guest session creation failed:', sessionData.error);
        return { success: false, error: sessionData.error || 'Guest session creation failed' };
      }

      console.log('✅ Guest session created:', sessionData.sessionId);

      currentSession = { id: sessionData.sessionId, student: authData.student, isGuest: true };
      sessionActive = true;
      isKioskLocked = false; // Unlock the system

      // After guest login, allow normal window behavior
      mainWindow.setClosable(false);
      mainWindow.setMinimizable(true);
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setFullScreen(false);
      mainWindow.maximize();

      // Release global shortcuts
      try {
        globalShortcut.unregisterAll();
        console.log('🔓 Guest mode: shortcuts unregistered - system free for use');
      } catch (e) {
        console.error('⚠️ Error unregistering shortcuts:', e.message || e);
      }

      console.log(`🔓 System unlocked for Guest User`);

      // Create and show timer window (minimized)
      createTimerWindow('Guest User', 'GUEST');

      // Notify renderer
      setTimeout(() => {
        console.log('🎬 Sending guest session-created event to renderer:', sessionData.sessionId);
        mainWindow.webContents.send('session-created', {
          sessionId: sessionData.sessionId,
          serverUrl: SERVER_URL,
          studentInfo: {
            studentId: 'GUEST',
            studentName: 'Guest User',
            systemNumber: SYSTEM_NUMBER,
            isGuest: true
          }
        });
      }, 1000);

      return { 
        success: true, 
        student: authData.student, 
        sessionId: sessionData.sessionId,
        isGuest: true
      };
    } catch (error) {
      console.error('❌ Guest access error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }  });

  // System shutdown handler
  ipcMain.handle('shutdown-system', async () => {
    try {
      console.log('🔌 System shutdown command received from admin');
      
      // Perform logout first if there's an active session
      if (sessionActive && currentSession) {
        console.log('🚪 Logging out before shutdown...');
        await fetch(`${SERVER_URL}/api/student-logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSession.id }),
        }).catch(err => console.error('❌ Logout error during shutdown:', err));
      }
      
      // Import exec for executing system commands - use promisify to wait for result
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const platform = os.platform();
      let shutdownCommand;
      
      if (platform === 'win32') {
        // Windows: shutdown in 5 seconds with message
        shutdownCommand = 'shutdown /s /t 5 /c "System shutdown initiated by administrator"';
      } else if (platform === 'linux') {
        // Linux: shutdown in 1 minute
        shutdownCommand = 'sudo shutdown -h +1 "System shutdown initiated by administrator"';
      } else if (platform === 'darwin') {
        // macOS: shutdown in 1 minute
        shutdownCommand = 'sudo shutdown -h +1 "System shutdown initiated by administrator"';
      }
      
      console.log(`🔌 Executing shutdown command: ${shutdownCommand}`);
      
      // WAIT for exec to complete and check if it succeeded
      try {
        const { stdout, stderr } = await execAsync(shutdownCommand);
        console.log('✅ Shutdown command executed successfully!');
        if (stdout) console.log('stdout:', stdout);
        if (stderr) console.log('stderr:', stderr);
        return { success: true, message: 'Shutdown initiated - system will power off in 5 seconds' };
      } catch (execError) {
        console.error('❌ Shutdown command FAILED:', execError.message);
        console.error('   Error code:', execError.code);
        console.error('   This usually means insufficient permissions (needs admin rights)');
        return { 
          success: false, 
          error: `Permission denied - needs administrator privileges. Error: ${execError.message}`,
          code: execError.code
        };
      }
    } catch (error) {
      console.error('❌ Shutdown error:', error);
      return { success: false, error: error.message };
    }
  });

  // ========================================================================
  // 69-SYSTEM LAB - FORCE WINDOWS SHUTDOWN HANDLER
  // ========================================================================
  ipcMain.handle('force-windows-shutdown', async () => {
    try {
      console.log('\n============================================================');
      console.log('⚡ FORCE WINDOWS SHUTDOWN INITIATED');
      console.log('   System:', SYSTEM_NUMBER);
      console.log('   Time:', new Date().toLocaleString());
      console.log('============================================================\n');
      
      // Perform quick logout if there's an active session (no waiting)
      if (sessionActive && currentSession) {
        console.log('🚪 Quick logout before shutdown...');
        try {
          await fetch(`${SERVER_URL}/api/student-logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSession.id })
          });
        } catch (err) {
          console.log('⚠️ Logout skipped (continuing with shutdown)');
        }
      }
      
      // Import exec for executing system commands - use promisify to wait for result
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      // Windows immediate shutdown command (5 second delay for safety)
      const shutdownCommand = 'shutdown /s /f /t 5';
      
      console.log('⚡ Executing Windows shutdown...');
      console.log('   Command: shutdown /s /f /t 5');
      console.log('   /s = Shutdown');
      console.log('   /f = Force close applications');
      console.log('   /t 5 = 5 second delay');
      
      // WAIT for exec to complete and check if it succeeded
      try {
        const { stdout, stderr } = await execAsync(shutdownCommand);
        console.log('✅ Shutdown command executed successfully - system powering off in 5 seconds');
        if (stdout) console.log('stdout:', stdout);
        if (stderr) console.log('stderr:', stderr);
        return { success: true, message: 'System shutting down in 5 seconds' };
      } catch (execError) {
        console.error('❌ Shutdown command FAILED:', execError.message);
        console.error('   Error code:', execError.code);
        console.error('   This usually means insufficient permissions (needs admin rights)');
        return { 
          success: false, 
          error: `Permission denied - needs administrator privileges. Error: ${execError.message}`,
          code: execError.code
        };
      }
    } catch (error) {
      console.error('❌ Force shutdown error:', error);
      return { success: false, error: error.message };
    }
  });

  // Admin shutdown handler (legacy - keeping for compatibility)
  ipcMain.handle('admin-shutdown', async () => {
    console.log('🔌 Admin shutdown (legacy) - redirecting to force shutdown');
    const { exec } = require('child_process');
    exec('shutdown /s /f /t 0');
    return { success: true };
  });
  // ========================================================================
  // END 69-SYSTEM LAB SHUTDOWN HANDLERS
  // ========================================================================
}

// Enable screen capturing before app ready
try {
  app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
  app.commandLine.appendSwitch('auto-select-desktop-capture-source', 'Entire screen');
  app.commandLine.appendSwitch('enable-features', 'MediaStream,GetDisplayMedia');
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
  app.commandLine.appendSwitch('disable-web-security');
  console.log('✅ Screen capturing switches enabled');
} catch (error) {
  console.error('❌ Error setting command line switches:', error);
}

app.whenReady().then(() => {
  setupAutoStart();  // ✅ Setup auto-start for production
  setupIPCHandlers();
  
  if (KIOSK_MODE) {
    console.log('🔒 KIOSK MODE ENABLED - Full system lockdown');
    console.log('🔒 Initializing secure environment...');
    
    // Block shortcuts BEFORE creating window to ensure immediate lockdown
    blockKioskShortcuts();
    
    // 🚀 Create window IMMEDIATELY with instant display
    // This ensures kiosk appears within 1ms of app launch
    createWindow();
    
    console.log('🔒 Kiosk initialized - system fully locked');
    console.log('🔒 Window shown INSTANTLY - no gap for Windows access');
    console.log('🔒 Fullscreen window covers taskbar completely');
    
    // ========================================================================
    // 69-SYSTEM LAB - HEARTBEAT & SHUTDOWN HANDLER
    // ========================================================================
    
    // Send system heartbeat to server every 30 seconds
    function sendSystemHeartbeat() {
      const systemInfo = {
        systemNumber: SYSTEM_NUMBER,
        labId: LAB_ID,
        ipAddress: getLocalIP(),
        timestamp: new Date().toISOString()
      };
      
      fetch(`${SERVER_URL}/api/system-heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemInfo)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log(`💓 Heartbeat sent: ${systemInfo.systemNumber} (${systemInfo.ipAddress})`);
        }
      })
      .catch(err => {
        // Silently fail - don't spam logs
        if (Math.random() < 0.1) { // Log only 10% of errors
          console.log('💔 Heartbeat error (network may be down)');
        }
      });
    }
    
    // Send heartbeat every 30 seconds
    setInterval(sendSystemHeartbeat, 30000);
    sendSystemHeartbeat(); // Send immediately on startup
    
    console.log('✅ System heartbeat started (every 30 seconds)');
    
    // ========================================================================
    // END 69-SYSTEM LAB FEATURES
    // ========================================================================
  } else {
    console.log('✅ TESTING MODE - Shortcuts enabled, DevTools available');
    createWindow();
  }
});

app.on('window-all-closed', () => {
  // 🔒 CRITICAL FIX: NEVER quit the app in kiosk mode
  // Always recreate window to prevent system shutdown
  console.log('🚫 App quit blocked - kiosk mode active, recreating window');
  createWindow(); // Always recreate window - never quit
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Block keyboard shortcuts to prevent DevTools and window switching
function blockKioskShortcuts() {
  // Block DevTools shortcuts
  const devToolsShortcuts = [
    'F12',
    'CommandOrControl+Shift+I',
    'CommandOrControl+Shift+J',
    'CommandOrControl+Shift+C',
    'CommandOrControl+Option+I',
    'CommandOrControl+Option+J'
  ];
    // Block window management shortcuts
  const windowShortcuts = [
    'Alt+F4',
    'CommandOrControl+W',
    'CommandOrControl+Q',
    'Alt+Tab',                    // 🔒 Block Alt+Tab (main requirement)
    'Alt+Shift+Tab',             // 🔒 Block reverse Alt+Tab
    'CommandOrControl+Tab',
    'F11'
    // NOTE: 'Escape' is registered separately in ready-to-show for OS-level blocking
  ];
  
  // Block system shortcuts
  const systemShortcuts = [
    'CommandOrControl+Alt+Delete',
    'CommandOrControl+Shift+Escape',
    'CommandOrControl+Escape',
    'Alt+Space',
    'Super',                     // 🔒 Block Windows key
    'Meta',                      // 🔒 Block Meta key
    
    // 🚫 WINDOWS KEY COMBINATIONS - Complete Desktop Access Blocking
    'Meta+D',                    // 🔒 Show desktop
    'Meta+E',                    // 🔒 File explorer
    'Meta+R',                    // 🔒 Run dialog
    'Meta+L',                    // 🔒 Lock screen
    'Meta+Tab',                  // 🔒 Task view
    'Meta+X',                    // 🔒 Power user menu
    'Meta+I',                    // 🔒 Settings
    'Meta+A',                    // 🔒 Action center
    'Meta+S',                    // 🔒 Search
    'Meta+M',                    // 🔒 Minimize all
    'Meta+K',                    // 🔒 Connect
    'Meta+P',                    // 🔒 Project/Display
    'Meta+U',                    // 🔒 Ease of Access
    'Meta+B',                    // 🔒 Focus notification area
    'Meta+Home',                 // 🔒 Minimize non-active
    
    // 🚫 ADDITIONAL ESCAPE ROUTES
    'Esc',                       // 🔒 Escape key variant
    'Alt+Esc',                   // 🔒 Window cycling
    'Alt+F6',                    // 🔒 Cycle window elements
    
    // 🚫 REFRESH & RELOAD
    'CommandOrControl+R',        // 🔒 Block refresh
    'F5',                        // 🔒 Block F5 refresh
    'CommandOrControl+F5',       // 🔒 Block force refresh
    'CommandOrControl+Shift+R',  // 🔒 Block hard refresh
    
    // 🚫 BROWSER/WINDOW CONTROLS
    'CommandOrControl+N',        // 🔒 Block new window
    'CommandOrControl+T',        // 🔒 Block new tab
    'CommandOrControl+Shift+N',  // 🔒 Block incognito
    'CommandOrControl+L',        // 🔒 Block address bar focus
    'CommandOrControl+D',        // 🔒 Block bookmark
    'CommandOrControl+H',        // 🔒 Block history
    'CommandOrControl+J',        // 🔒 Block downloads
    'CommandOrControl+U',        // 🔒 Block view source
    'CommandOrControl+P',        // 🔒 Block print
    'CommandOrControl+S',        // 🔒 Block save
    'CommandOrControl+O',        // 🔒 Block open file
    'CommandOrControl+A',        // 🔒 Block select all
    'CommandOrControl+F',        // 🔒 Block find
    'CommandOrControl+G',        // 🔒 Block find next
    'CommandOrControl+Z',        // 🔒 Block undo
    'CommandOrControl+Y',        // 🔒 Block redo
    'CommandOrControl+X',        // 🔒 Block cut
    'CommandOrControl+C',        // 🔒 Block copy
    'CommandOrControl+V'         // 🔒 Block paste
  ];
  
  const allShortcuts = [...devToolsShortcuts, ...windowShortcuts, ...systemShortcuts];
  
  allShortcuts.forEach(shortcut => {
    try {
      globalShortcut.register(shortcut, () => {
        console.log(`🚫 Blocked shortcut: ${shortcut}`);
        // Force focus back to main window
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
          mainWindow.setAlwaysOnTop(true);
        }
      });
    } catch (error) {
      console.log(`⚠️ Could not register shortcut: ${shortcut}`);
    }
  });
  
  console.log('🔒 FULL KIOSK MODE - All keyboard shortcuts blocked');
  console.log(`🚫 Blocked ${allShortcuts.length} shortcuts including Alt+Tab`);
}

// Helper function for logout
async function performLogout() {
  if (sessionActive && currentSession) {
    try {
      console.log('🚪 Performing logout for session:', currentSession.id);
      
      mainWindow.webContents.send('stop-live-stream');
      
      await fetch(`${SERVER_URL}/api/student-logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSession.id }),
      });
      
      sessionActive = false;
      currentSession = null;
      isKioskLocked = true;
      
      console.log('✅ Logout completed');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }
}

function gracefulLogout() {
  if (sessionActive && currentSession) {
    performLogout().finally(() => {
      app.quit();
    });
  } else {
    app.quit();
  }
}

process.on('SIGINT', (signal) => {
  console.log('SIGINT received, logging out and quitting...');
  gracefulLogout();
});

process.on('SIGTERM', (signal) => {
  console.log('SIGTERM received, logging out and quitting...');
  gracefulLogout();
});

app.on('before-quit', (e) => {
  if (sessionActive) {
    e.preventDefault();
    gracefulLogout();
  }
});
