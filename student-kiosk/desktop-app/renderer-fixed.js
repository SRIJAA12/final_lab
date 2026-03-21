// FIXED RENDERER - Screen Mirroring Working Version
let socket = null;
let pc = null;
let sessionId = null;
let localStream = null;
const serverUrl = "http://192.168.29.212:7401";

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
  socket.on('admin-offer', handleAdminOffer);
  
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

  // Register this kiosk with backend
  console.log('📡 Registering kiosk for session:', sessionId);
  socket.emit('register-kiosk', { sessionId });

  // Prepare screen capture
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
    alert('Screen sharing failed: ' + error.message);
  }
}

// Handle admin offer
async function handleAdminOffer({ offer, sessionId: adminSessionId, adminSocketId }) {
  console.log('📥 KIOSK: Received admin offer for session:', adminSessionId);
  console.log('📥 KIOSK: Current sessionId:', sessionId);
  console.log('📥 KIOSK: localStream available:', !!localStream);
  
  if (adminSessionId !== sessionId) {
    console.warn('⚠️ Session ID mismatch - admin:', adminSessionId, 'kiosk:', sessionId);
    return;
  }

  if (!localStream) {
    console.error('❌ Screen stream not ready - cannot create peer connection');
    return;
  }

  try {
    // Create peer connection (LAN-only: STUN blocked by college firewall)
    console.log('🔗 Creating peer connection (LAN-only, no STUN)...');
    pc = new RTCPeerConnection({
      iceServers: [],      // No STUN needed — all machines on same 10.10.46.x subnet
      iceCandidatePoolSize: 0
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
        console.log('🧊 KIOSK SENDING ICE CANDIDATE');
        socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          sessionId: sessionId
        });
      } else {
        console.log('🧊 All ICE candidates sent');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🔗 Kiosk connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('✅✅✅ KIOSK CONNECTED! VIDEO FLOWING!');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('🧊 Kiosk ICE state:', pc.iceConnectionState);
    };

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
});

console.log('🎬 FIXED Renderer.js loaded and ready');
