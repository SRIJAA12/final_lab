// FIXED RENDERER - Screen Mirroring Working Version
let socket = null;
let pc = null;
let sessionId = null;
let localStream = null;
let hardwareMonitor = null;
let currentStudentInfo = null;
let serverUrl = null; // Will be loaded dynamically
let socketInitialized = false;
let socketInitPromise = null;
let sessionEndingTimerId = null;

console.log('🎬 FIXED Renderer.js loading...');

// Load server URL from main process (which reads from config)
async function loadServerUrl() {
  try {
    serverUrl = await window.electronAPI.getServerUrl();
    console.log('✅ Server URL loaded from config:', serverUrl);
    return serverUrl;
  } catch (error) {
    console.error('⚠️ Error loading server URL:', error);
    serverUrl = 'http://localhost:7401'; // Fallback
    return serverUrl;
  }
}

// Initialize socket connection
async function initializeSocket() {
  // Return existing promise if already initializing
  if (socketInitPromise) {
    return socketInitPromise;
  }
  
  socketInitPromise = (async () => {
    try {
      // Make sure we have the server URL first
      if (!serverUrl) {
        await loadServerUrl();
      }
      
      console.log('🔌 Initializing socket connection to:', serverUrl);
      
      socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      });

      socket.on('connect', () => {
        console.log('✅ Socket.io connected:', socket.id);
        socketInitialized = true;
        
        // 🔧 FIX: Update hardware monitor socket reference on reconnect
        if (hardwareMonitor) {
          console.log('🔄 Updating hardware monitor socket after reconnect');
          hardwareMonitor.updateSocket(socket);
          // Give a small delay for socket to stabilize before sending alerts
          setTimeout(() => {
            hardwareMonitor.retryPendingAlerts();
          }, 1000);
        }
      });

      socket.on('disconnect', () => {
        console.log('❌ Socket.io disconnected');
        socketInitialized = false;
        if (hardwareMonitor) {
          console.log('⚠️ Hardware monitor socket disconnected');
        }
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Socket connect error:', err);
      });

      // Listen for admin offers
      socket.on('admin-offer', handleAdminOffer);
      
      // Listen for ICE candidates
      socket.on('webrtc-ice-candidate', handleICECandidate);
      
      // Listen for shutdown command from admin
      socket.on('execute-shutdown', handleShutdownCommand);
      
      // 🔓 GUEST ACCESS: Listen for guest access command from admin
      socket.on('guest-access-granted', handleGuestAccess);

      // Lab session ending (admin or timetable)
      socket.on('lab-session-ending', handleLabSessionEnding);
      
      console.log('✅ Socket event listeners registered');
      return socket;
    } catch (error) {
      console.error('❌ Socket initialization error:', error);
      throw error;
    }
  })();
  
  return socketInitPromise;
}

// Initialize immediately (async) and wait for it
(async () => {
  try {
    await initializeSocket();
    console.log('✅ Socket initialization complete');
    
    // Wait for socket to connect
    await waitForSocketConnection();
    
    // Register kiosk with server even before login (for guest access and screen mirroring)
    const systemNumber = await window.electronAPI?.getSystemNumber?.() || 'CC1-01';
    const labId = systemNumber.split('-')[0] || 'CC1';
    
    console.log('📡 Registering kiosk BEFORE login - System:', systemNumber, 'Lab:', labId);
    socket.emit('register-kiosk', { 
      sessionId: null, // No session yet
      systemNumber, 
      labId 
    });
    
    // Prepare screen capture even before login (so admin can see login screen)
    console.log('🎥 Preparing screen capture BEFORE login...');
    await prepareScreenCapture();
    
  } catch (err) {
    console.error('❌ Failed to initialize socket:', err);
  }
})();

// Listen for session creation event from main process
window.electronAPI.onSessionCreated(async (data) => {
  sessionId = data.sessionId;
  currentStudentInfo = data.studentInfo || {};
  console.log('✅ Session created event received:', { sessionId, studentInfo: currentStudentInfo });
  
  // Ensure socket is initialized first
  if (!socket) {
    console.log('⏳ Socket not initialized yet, initializing...');
    await initializeSocket();
  }
  
  // Clean up previous session resources
  if (localStream) {
    console.log('🧹 Cleaning up previous screen stream...');
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  if (pc) {
    console.log('🧹 Cleaning up previous peer connection...');
    pc.close();
    pc = null;
  }

  // Wait for socket connection
  if (!socket || !socket.connected) {
    console.log('⏳ Waiting for socket to connect...');
    await waitForSocketConnection();
  }
  
  console.log('✅ Socket is ready, proceeding with session setup');

  // Register this kiosk with backend (update registration with session ID)
  console.log('📡 Updating kiosk registration with session:', sessionId);
  // 🔧 MULTI-LAB: Include system number and lab ID for guest access
  const systemNumber = currentStudentInfo?.systemNumber || await window.electronAPI?.getSystemNumber?.() || 'CC1-01';
  const labId = systemNumber.split('-')[0] || 'CC1';
  socket.emit('register-kiosk', { sessionId, systemNumber, labId });

  // Start hardware monitoring
  startHardwareMonitoring();

  // Prepare screen capture (will emit screen-ready when done)
  await prepareScreenCapture();
});

// Wait for socket connection
function waitForSocketConnection() {
  return new Promise((resolve) => {
    if (socket && socket.connected) {
      resolve();
    } else {
      const checkConnection = () => {
        if (socket && socket.connected) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    }
  });
}

// Prepare screen capture with retry logic
async function prepareScreenCapture(retryCount = 0) {
  try {
    console.log(`🎥 Preparing screen capture... (Attempt ${retryCount + 1}/3)`);

    const sources = await window.electronAPI.getScreenSources();
    
    if (!sources || sources.length === 0) {
      throw new Error('No screen sources available');
    }

    console.log(`📺 Found ${sources.length} screen sources:`);
    sources.forEach((s, i) => console.log(`  ${i + 1}. ${s.name} (ID: ${s.id})`));

    const screenSource = sources.find(source => source.id.startsWith('screen')) || sources[0];
    console.log('📺 Selected screen source:', screenSource.name, 'ID:', screenSource.id);

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: screenSource.id,
          minWidth: 640,
          maxWidth: 800,
          minHeight: 480,
          maxHeight: 600,
          maxFrameRate: 10
        }
      }
    });

    console.log('✅ Screen stream obtained successfully');
    console.log('📊 Stream tracks:', localStream.getTracks().map(t => `${t.kind} (${t.label})`));
    
    // IMPORTANT: Keep tracks active by adding onended listeners
    localStream.getTracks().forEach(track => {
      track.onended = () => {
        console.warn('⚠️ Track ended, attempting to restart screen capture...');
        setTimeout(() => prepareScreenCapture(), 1000);
      };
      console.log('✅ Track keeper active:', track.kind, track.readyState);
    });
    
    console.log('✅ Ready for admin connections - waiting for offers...');
    
    // CRITICAL: Notify server that kiosk is NOW ready with screen capture
    // Use current sessionId if available, otherwise use null (for pre-login screen mirroring)
    const currentSessionId = sessionId || null;
    console.log('\n==============================================');
    console.log('🎉 EMITTING KIOSK-SCREEN-READY EVENT');
    console.log('Session ID:', currentSessionId || 'PRE-LOGIN');
    console.log('Has Video:', true);
    console.log('==============================================\n');
    
    if (socket && socket.connected) {
      socket.emit('kiosk-screen-ready', { 
        sessionId: currentSessionId, 
        hasVideo: true,
        timestamp: new Date().toISOString() 
      });
      console.log('✅ Screen ready event emitted successfully');
    } else {
      console.warn('⚠️ Socket not connected, cannot emit screen-ready event');
    }

  } catch (error) {
    console.error(`❌ Error preparing screen capture (Attempt ${retryCount + 1}/3):`, error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Retry up to 3 times with increasing delays
    if (retryCount < 2) {
      const delay = (retryCount + 1) * 2000; // 2s, 4s
      console.log(`🔄 Retrying in ${delay/1000} seconds...`);
      setTimeout(() => {
        prepareScreenCapture(retryCount + 1);
      }, delay);
    } else {
      console.error('❌❌❌ SCREEN CAPTURE FAILED AFTER 3 ATTEMPTS!');
      console.error('❌ Possible causes:');
      console.error('  1. Graphics driver issue - update your GPU drivers');
      console.error('  2. Running in Remote Desktop - screen capture doesn\'t work in RDP');
      console.error('  3. Multiple displays causing conflicts');
      console.error('  4. Windows permissions - run as administrator');
      alert('\u274c Screen capture failed after 3 attempts!\n\n' +
            'Possible solutions:\n' +
            '1. Update graphics drivers\n' +
            '2. Don\'t use Remote Desktop\n' +
            '3. Try disconnecting extra monitors\n' +
            '4. Run as administrator\n\n' +
            'Error: ' + error.message);
    }
  }
}

// Handle admin offer
async function handleAdminOffer({ offer, sessionId: adminSessionId, adminSocketId }) {
  console.log('📥 KIOSK: Received admin offer for session:', adminSessionId || 'PRE-LOGIN');
  console.log('📥 KIOSK: Current sessionId:', sessionId || 'NONE (pre-login)');
  console.log('📥 KIOSK: localStream available:', !!localStream);
  console.log('📥 KIOSK: Admin socket ID:', adminSocketId);
  
  // Send immediate acknowledgment
  socket.emit('offer-received', { sessionId: adminSessionId || sessionId, adminSocketId, timestamp: new Date().toISOString() });
  
  // Allow admin offers even before login (for pre-login screen mirroring)
  // Only check session ID match if both are set (after login)
  if (adminSessionId && sessionId && adminSessionId !== sessionId) {
    console.warn('⚠️ Session ID mismatch - admin:', adminSessionId, 'kiosk:', sessionId);
    return;
  }

  if (!localStream) {
    console.error('❌ Screen stream not ready - cannot create peer connection');
    // Try to prepare screen capture if not ready
    console.log('🔄 Attempting to prepare screen capture...');
    try {
      await prepareScreenCapture();
    } catch (err) {
      console.error('❌ Failed to prepare screen capture:', err);
      return;
    }
  }

  try {
    // Close existing peer connection if any
    if (pc) {
      console.log('🗑️ Closing existing peer connection...');
      pc.close();
      pc = null;
    }
    
    // Create peer connection (LAN-only: STUN blocked by college firewall)
    console.log('🔗 Creating peer connection (LAN-only, no STUN)...');
    pc = new RTCPeerConnection({
      iceServers: [],      // No STUN needed — all machines on same 10.10.46.x subnet
      iceCandidatePoolSize: 0
    });

    console.log('✅ KIOSK: Peer connection created');

    // Add all tracks from stream and ensure they're enabled
    console.log('📊 Adding tracks to peer connection...');
    let trackCount = 0;
    localStream.getTracks().forEach(track => {
      // Ensure track is enabled and live
      track.enabled = true;
      console.log(`➕ Adding track ${++trackCount}:`, {
        kind: track.kind,
        label: track.label,
        readyState: track.readyState,
        enabled: track.enabled,
        muted: track.muted
      });
      
      const sender = pc.addTrack(track, localStream);
      console.log('✅ Track added, sender:', sender ? 'created' : 'FAILED');
    });
    
    console.log(`✅ Total tracks added to peer connection: ${trackCount}`);
    
    // Verify senders
    const senders = pc.getSenders();
    console.log('📊 Peer connection senders:', senders.length);
    senders.forEach((sender, i) => {
      console.log(`  Sender ${i + 1}:`, sender.track ? `${sender.track.kind} (${sender.track.readyState})` : 'NO TRACK');
    });

    // Set up event handlers
    pc.onicecandidate = event => {
      if (event.candidate) {
        console.log('🧊 KIOSK SENDING ICE CANDIDATE:', event.candidate.type);
        socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          sessionId: sessionId
        });
      } else {
        console.log('🧊 All ICE candidates sent (null candidate)');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Kiosk connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅✅✅ KIOSK CONNECTED! VIDEO FLOWING!');
      } else if (pc.connectionState === 'disconnected') {
        console.warn('⚠️ Connection disconnected, may reconnect...');
      } else if (pc.connectionState === 'failed') {
        console.error('❌ Connection failed! Attempting restart...');
        setTimeout(() => {
          if (localStream) {
            console.log('🔄 Re-emitting screen-ready after connection failure');
            socket.emit('kiosk-screen-ready', { sessionId, hasVideo: true });
          }
        }, 2000);
      } else if (pc.connectionState === 'closed') {
        console.warn('⚠️ Connection closed by remote');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 Kiosk ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.error('❌ ICE connection failed!');
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn('⚠️ ICE disconnected');
      }
    };
    
    // Monitor track states
    pc.ontrack = event => {
      console.log('📹 Track event on peer connection (kiosk):', event.track.kind);
    };
    
    // Log when tracks are added
    console.log('✅ All event handlers attached to peer connection');

    // Set remote description
    console.log('🤝 KIOSK: Setting remote description');
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('✅ KIOSK: Remote description set');
    
    // Create answer
    console.log('📝 KIOSK: Creating answer');
    const answer = await pc.createAnswer();
    console.log('✅ KIOSK: Answer created');
    
    // Set local description
    console.log('📝 KIOSK: Setting local description');
    await pc.setLocalDescription(answer);
    console.log('✅ KIOSK: Local description set');
    
    // Send answer
    console.log('📤 KIOSK: Sending answer to admin');
    console.log('📤 KIOSK: Answer details:', {
      hasAnswer: !!answer,
      answerType: answer?.type,
      adminSocketId: adminSocketId,
      sessionId: sessionId,
      socketConnected: socket.connected,
      socketId: socket.id
    });
    
    socket.emit('webrtc-answer', { 
      answer, 
      adminSocketId, 
      sessionId 
    });
    
    console.log('✅ ✅ ✅ KIOSK: Answer EMITTED - handshake completed!');
    console.log('✅ If you see this, the answer WAS sent from kiosk!');
    
  } catch (error) {
    console.error('❌ KIOSK: Error handling offer:', error);
  }
}

// Handle ICE candidates
async function handleICECandidate({ candidate, sessionId: cid }) {
  console.log('🧊 KIOSK: Received ICE from admin');
  
  if (!pc) {
    console.warn('⚠️ PC not ready');
    return;
  }
  
  if (cid && cid !== sessionId) {
    console.warn('⚠️ Session mismatch');
    return;
  }

  try {
    console.log('🧊 KIOSK: Adding admin ICE candidate');
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('✅ KIOSK: ICE added');
  } catch (error) {
    console.error('❌ KIOSK: ICE error:', error);
  }
}

// Start hardware monitoring
function startHardwareMonitoring() {
  try {
    // Stop previous monitoring if exists
    if (hardwareMonitor) {
      console.log('🧹 Stopping previous hardware monitor...');
      hardwareMonitor.stopMonitoring();
      hardwareMonitor = null;
    }

    // Ensure we have student info
    if (!currentStudentInfo || !currentStudentInfo.studentId) {
      console.warn('⚠️ Cannot start hardware monitoring - missing student info');
      return;
    }

    console.log('🔍 Starting hardware monitoring for:', currentStudentInfo.studentName);
    
    // Load HardwareMonitor class
    const HardwareMonitor = require('./hardware-monitor.js');
    
    // Create new monitor instance
    hardwareMonitor = new HardwareMonitor(socket, {
      studentId: currentStudentInfo.studentId,
      studentName: currentStudentInfo.studentName,
      systemNumber: currentStudentInfo.systemNumber || 'Unknown'
    });
    
    console.log('✅ Hardware monitoring started successfully');
  } catch (error) {
    console.error('❌ Error starting hardware monitoring:', error);
  }
}

// Stop hardware monitoring
function stopHardwareMonitoring() {
  if (hardwareMonitor) {
    console.log('🛑 Stopping hardware monitoring...');
    hardwareMonitor.stopMonitoring();
    hardwareMonitor = null;
    console.log('✅ Hardware monitoring stopped');
  }
}

// Listen for stop command
window.electronAPI.onStopLiveStream(() => {
  console.log('🛑 Stop live stream command received');
  
  // Stop hardware monitoring
  stopHardwareMonitoring();
  
  if (pc) {
    pc.getSenders().forEach(sender => {
      if (sender.track) sender.track.stop();
    });
    pc.close();
    pc = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  sessionId = null;
  currentStudentInfo = null;
});

// Handle shutdown command from admin
async function handleShutdownCommand() {
  console.log('🔌 ⚠️ SHUTDOWN COMMAND RECEIVED FROM ADMIN');
  
  // Show warning to student
  alert('⚠️ SYSTEM SHUTDOWN\n\nThis computer is being shut down by the administrator.\n\nPlease save your work immediately.\n\nShutdown will occur in 10 seconds...');
  
  try {
    // Stop hardware monitoring
    stopHardwareMonitoring();
    
    // Clean up screen stream
    if (localStream) {
      console.log('🧹 Cleaning up screen stream...');
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    
    // Close peer connection
    if (pc) {
      console.log('🧹 Closing peer connection...');
      pc.close();
      pc = null;
    }
    
    // Request logout and shutdown from main process
    console.log('🔌 Initiating system shutdown...');
    const result = await window.electronAPI.shutdownSystem();
    
    if (result.success) {
      console.log('✅ Shutdown initiated successfully');
    } else {
      console.error('❌ Shutdown failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}

// 🔓 Handle guest access granted by admin
async function handleGuestAccess(data) {
  console.log('🔓 GUEST ACCESS GRANTED BY ADMIN');
  console.log('Guest access data:', data);
  
  try {
    // Hide login screen and unlock system
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.style.display = 'none';
    }
    
    // Create guest session via IPC
    if (window.electronAPI && window.electronAPI.guestLogin) {
      const result = await window.electronAPI.guestLogin({
        systemNumber: data.systemNumber || 'GUEST-01',
        labId: data.labId || 'CC1'
      });
      
      if (result.success) {
        console.log('✅ Guest session created successfully');
        // Show guest mode indicator (optional)
        showGuestModeIndicator();
      } else {
        console.error('❌ Guest login failed:', result.error);
        alert('❌ Failed to enable guest access: ' + (result.error || 'Unknown error'));
      }
    } else {
      // Fallback: directly unlock via main process message
      console.log('⚠️ guestLogin IPC not available, using fallback');
      if (window.electronAPI && window.electronAPI.triggerGuestLogin) {
        window.electronAPI.triggerGuestLogin();
      }
    }
  } catch (error) {
    console.error('❌ Error handling guest access:', error);
    alert('❌ Error enabling guest access: ' + error.message);
  }
}

// Show guest mode indicator
function showGuestModeIndicator() {
  // Create a small indicator in corner
  let indicator = document.getElementById('guestModeIndicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'guestModeIndicator';
    indicator.style.cssText = 'position: fixed; top: 10px; right: 10px; background: #ffc107; color: #000; padding: 10px 15px; border-radius: 5px; z-index: 10000; font-weight: bold; box-shadow: 0 2px 10px rgba(0,0,0,0.3);';
    indicator.innerHTML = '👤 Guest Mode Active';
    document.body.appendChild(indicator);
  }
}

// Handle lab session ending from admin/timetable
function handleLabSessionEnding(data) {
  try {
    console.log('🛎️ Lab session ending notification received:', data);

    if (!data || !data.sessionId) {
      return;
    }

    // Ignore if this notification is for a different session
    if (sessionId && data.sessionId !== sessionId) {
      console.log('ℹ️ Lab-session-ending for different session, ignoring');
      return;
    }

    const timeoutSeconds = typeof data.timeoutSeconds === 'number' ? data.timeoutSeconds : 60;
    const messageText = data.message || 'Session has ended. Please save your work and log out within 1 minute.';

    // If a previous timer is running, clear it
    if (sessionEndingTimerId) {
      clearInterval(sessionEndingTimerId);
      sessionEndingTimerId = null;
    }

    // Create or reuse notification container
    let existing = document.getElementById('sessionEndNotice');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'sessionEndNotice';
      existing.style.position = 'fixed';
      existing.style.top = '0';
      existing.style.left = '0';
      existing.style.width = '100%';
      existing.style.height = '100%';
      existing.style.background = 'rgba(0,0,0,0.65)';
      existing.style.display = 'flex';
      existing.style.alignItems = 'center';
      existing.style.justifyContent = 'center';
      existing.style.zIndex = '99999';
      existing.innerHTML = `
        <div style="
          background:white;
          border-radius:20px;
          padding:30px 40px;
          max-width:520px;
          width:90%;
          text-align:center;
          box-shadow:0 20px 40px rgba(0,0,0,0.4);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        ">
          <h2 style="color:#dc3545;margin-bottom:10px;">🛑 Session Ended</h2>
          <p id="sessionEndMessage" style="margin-bottom:15px;color:#333;font-size:15px;"></p>
          <div style="
            font-size:32px;
            font-weight:bold;
            font-family:'Courier New', monospace;
            margin-bottom:15px;
            color:#28a745;
          " id="sessionEndCountdown">60s</div>
          <p style="font-size:13px;color:#555;margin-bottom:20px;">
            Please save your work and click <strong>Logout Now</strong>. If you do not logout,
            the system will automatically log you out when the countdown reaches zero.
          </p>
          <button id="sessionEndLogoutBtn" style="
            padding:10px 30px;
            background:linear-gradient(135deg,#28a745,#20c997);
            border:none;
            border-radius:8px;
            color:white;
            font-size:15px;
            font-weight:bold;
            cursor:pointer;
            box-shadow:0 6px 15px rgba(40,167,69,0.4);
          ">
            🚪 Logout Now
          </button>
        </div>
      `;
      document.body.appendChild(existing);

      // Wire logout button once
      const btn = document.getElementById('sessionEndLogoutBtn');
      if (btn) {
        btn.addEventListener('click', async () => {
          console.log('🚪 Session-end dialog: manual Logout clicked');
          try {
            await window.electronAPI.studentLogout();
          } catch (err) {
            console.error('❌ Error during manual logout from session-end dialog:', err);
          }
        });
      }
    }

    // Update message text
    const msgEl = document.getElementById('sessionEndMessage');
    if (msgEl) {
      msgEl.textContent = messageText;
    }

    let remaining = timeoutSeconds;
    const countdownEl = document.getElementById('sessionEndCountdown');
    if (countdownEl) {
      countdownEl.textContent = `${remaining}s`;
    }

    existing.style.display = 'flex';

    sessionEndingTimerId = setInterval(async () => {
      remaining -= 1;
      if (countdownEl) {
        countdownEl.textContent = `${remaining}s`;
      }

      if (remaining <= 0) {
        clearInterval(sessionEndingTimerId);
        sessionEndingTimerId = null;
        console.log('⏰ Session-end countdown finished, triggering automatic logout');
        try {
          await window.electronAPI.studentLogout();
        } catch (err) {
          console.error('❌ Error during automatic logout at session end:', err);
        }
      }
    }, 1000);
  } catch (err) {
    console.error('❌ Error handling lab-session-ending event:', err);
  }
}

console.log('🎬 FIXED Renderer.js loaded and ready');
