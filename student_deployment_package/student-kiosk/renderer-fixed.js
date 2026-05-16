// FIXED RENDERER - Screen Mirroring Working Version (Simultaneous Multi-System)
let socket = null;
let pc = null;
let sessionId = null;
let adminSocketId = null;  // Store adminSocketId for ICE routing
let localStream = null;
const serverUrl = "http://192.168.29.212:7401";

// 🔥 FIX 1: ICE queue — admin ICE candidates can arrive before setRemoteDescription
let pendingICE = [];

// 🔥 FIX 2: Offer queue — offer can arrive before localStream is ready or sessionId is set
let pendingOffer = null;

console.log('🎬 FIXED Renderer.js loading...');

// Initialize socket connection
function initializeSocket() {
  console.log('🔌 Initializing socket connection to:', serverUrl);

  socket = io(serverUrl, {
    transports: ['websocket', 'polling'],
    timeout: 5000,
    forceNew: true
  });

  socket.on('connect', () => {
    console.log('✅ Socket.io connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket.io disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connect error:', err);
  });

  // Listen for admin offers
  socket.on('admin-offer', (data) => {
    console.log('📥 KIOSK: Received admin-offer for session:', data.sessionId, '| My sessionId:', sessionId);

    // 🔥 FIX 3: RACE CONDITION — the offer may arrive from the server before the renderer
    // gets the onSessionCreated event from the main process (especially under simultaneous load).
    // Old code: `if (adminSessionId !== sessionId) return;` → drops valid offers when sessionId is null.
    // Fix: if sessionId not set yet, accept the offer and queue it; process when sessionId arrives.
    if (!sessionId) {
      console.log('⏳ KIOSK: sessionId not set yet — queuing offer, will process after session is ready');
      pendingOffer = data;
      return;
    }

    if (data.sessionId && data.sessionId !== sessionId) {
      console.warn('⚠️ KIOSK: Session mismatch — offer for', data.sessionId, ', mine is', sessionId, '— ignoring');
      return;
    }

    processOffer(data);
  });

  // Listen for ICE candidates
  socket.on('webrtc-ice-candidate', handleICECandidate);
}

// Initialize immediately
initializeSocket();

// Listen for session creation event from main process
window.electronAPI.onSessionCreated(async (data) => {
  sessionId = data.sessionId;
  console.log('✅ Session created event received:', { sessionId });

  // Wait for socket connection
  if (!socket || !socket.connected) {
    console.log('⏳ Waiting for socket to connect...');
    await waitForSocketConnection();
  }

  // Register this kiosk with backend (include systemNumber for server-side ICE routing fallback)
  console.log('📡 Registering kiosk for session:', sessionId);
  socket.emit('register-kiosk', {
    sessionId,
    systemNumber: data.systemNumber || null,
    computerName: data.computerName || null,
    labId: data.labId || 'CC1'
  });

  // Prepare screen capture
  await prepareScreenCapture();

  // 🔥 FIX 2: Process any offer that arrived before we were ready
  if (pendingOffer) {
    console.log('🔄 KIOSK: Processing queued offer now that session is ready');
    const queued = pendingOffer;
    pendingOffer = null;
    processOffer(queued);
  }
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

// Prepare screen capture
async function prepareScreenCapture() {
  try {
    console.log('🎥 Preparing screen capture...');

    const sources = await window.electronAPI.getScreenSources();

    if (!sources || sources.length === 0) {
      throw new Error('No screen sources available');
    }

    const screenSource = sources.find(source => source.id.startsWith('screen')) || sources[0];
    console.log('📺 Screen source obtained:', screenSource.name);

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
    console.log('✅ Ready for admin connections - waiting for offers...');

  } catch (error) {
    console.error('❌ Error preparing screen capture:', error);
  }
}

// Process offer (called once sessionId AND localStream are ready)
async function processOffer(data) {
  const { offer, sessionId: offerSessionId, adminSocketId: offeredAdminSocketId } = data;

  // 🔥 FIX 4: If localStream not ready yet, wait for it (up to 10s)
  if (!localStream) {
    console.log('⏳ KIOSK: localStream not ready — waiting up to 10s...');
    const ready = await waitForStream(10000);
    if (!ready) {
      console.error('❌ KIOSK: Screen stream still not ready after 10s — cannot process offer');
      return;
    }
  }

  // Store adminSocketId so ICE candidates can include it
  adminSocketId = offeredAdminSocketId;

  // Close existing connection if any
  if (pc) {
    console.log('🔄 KIOSK: Closing existing peer connection');
    try { pc.close(); } catch (e) { }
    pc = null;
  }

  // Clear stale ICE queue from previous failed attempt
  if (pendingICE.length > 0) {
    console.log('🧊 KIOSK: Clearing', pendingICE.length, 'stale ICE candidates from previous attempt');
    pendingICE = [];
  }

  try {
    // Create peer connection (LAN-only: STUN blocked by college firewall)
    console.log('🔗 Creating peer connection (LAN-only, no STUN)...');
    pc = new RTCPeerConnection({
      iceServers: [],
      iceCandidatePoolSize: 0,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    });

    console.log('✅ KIOSK: Peer connection created');

    // Add all tracks from stream
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
      console.log('➕ Added track to PC:', track.kind, track.label);
    });

    // Set up event handlers
    pc.onicecandidate = event => {
      if (event.candidate) {
        console.log('🧊 KIOSK: Sending ICE candidate:', event.candidate.type);
        socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          sessionId: sessionId,
          adminSocketId: adminSocketId  // 🔥 FIX: Include so server can route directly
        });
      } else {
        console.log('🧊 KIOSK: All ICE candidates sent');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 KIOSK connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅✅✅ KIOSK CONNECTED! VIDEO FLOWING!');
      } else if (pc.connectionState === 'failed') {
        console.error('❌ KIOSK: Connection failed');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 KIOSK ICE state:', pc.iceConnectionState);
    };

    // Set remote description
    console.log('🤝 KIOSK: Setting remote description');
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('✅ KIOSK: Remote description set');

    // 🔥 FIX 1: Flush any ICE candidates that arrived before remote description was ready
    if (pendingICE.length > 0) {
      console.log(`🧊 KIOSK: Flushing ${pendingICE.length} queued ICE candidates`);
      for (const c of pendingICE) {
        await pc.addIceCandidate(new RTCIceCandidate(c))
          .catch(e => console.error('❌ Queued ICE error:', e));
      }
      pendingICE = [];
      console.log('✅ KIOSK: Queued ICE candidates flushed');
    }

    // Create and send answer
    console.log('📝 KIOSK: Creating answer');
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log('✅ KIOSK: Local description set');

    console.log('📤 KIOSK: Sending answer to admin:', adminSocketId);
    socket.emit('webrtc-answer', {
      answer,
      adminSocketId,
      sessionId
    });
    console.log('✅ KIOSK: Answer sent - handshake completed!');

  } catch (error) {
    console.error('❌ KIOSK: Error handling offer:', error);
  }
}

// Wait for localStream to become available
function waitForStream(timeoutMs) {
  return new Promise((resolve) => {
    if (localStream) return resolve(true);
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      if (localStream) return resolve(true);
      if (Date.now() >= deadline) return resolve(false);
      setTimeout(check, 200);
    };
    check();
  });
}

// Handle ICE candidates from admin
async function handleICECandidate({ candidate, sessionId: cid }) {
  if (!candidate) return;

  // 🔥 FIX 1: Queue if pc not ready yet (remote desc not set)
  if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
    console.log('🧊 KIOSK: PC not ready — queuing ICE candidate. Queue size:', pendingICE.length + 1);
    pendingICE.push(candidate);
    return;
  }

  if (cid && cid !== sessionId) {
    console.warn('⚠️ KIOSK: ICE session mismatch — ignoring');
    return;
  }

  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('✅ KIOSK: ICE candidate added');
  } catch (error) {
    console.error('❌ KIOSK: ICE error:', error);
  }
}

// Listen for stop command
window.electronAPI.onStopLiveStream(() => {
  console.log('🛑 Stop live stream command received');
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
  adminSocketId = null;
  pendingICE = [];
  pendingOffer = null;
});

console.log('🎬 FIXED Renderer.js loaded and ready');