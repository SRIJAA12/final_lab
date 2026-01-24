/**
 * Wake-on-LAN Service
 * Standalone service to wake up admin system from student systems
 * Does NOT modify existing code - can be integrated separately
 */

const wol = require('wake_on_lan');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3002; // Different port from main admin server

// Middleware
app.use(cors());
app.use(express.json());

// Configuration file for storing MAC addresses
const CONFIG_FILE = path.join(__dirname, 'wol-config.json');

// Default configuration
let config = {
    adminSystem: {
        name: "Admin Computer",
        macAddress: "00:00:00:00:00:00", // Default - needs to be configured
        ipAddress: "192.168.1.100", // Optional - for reference
        lastWakeTime: null
    },
    studentSystems: [], // Can add student system MACs if needed
    logs: []
};

// Load configuration
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            config = JSON.parse(data);
            console.log('✓ WoL configuration loaded');
        } else {
            saveConfig();
            console.log('⚠ New WoL configuration created - please set MAC address');
        }
    } catch (error) {
        console.error('Error loading WoL config:', error);
    }
}

// Save configuration
function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving WoL config:', error);
    }
}

// Add log entry
function addLog(action, status, message, sourceIP) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        status,
        message,
        sourceIP
    };
    
    config.logs.unshift(logEntry);
    
    // Keep only last 100 logs
    if (config.logs.length > 100) {
        config.logs = config.logs.slice(0, 100);
    }
    
    saveConfig();
}

// ===== API ENDPOINTS =====

// Wake up admin system
app.post('/api/wol/wake-admin', (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    console.log(`[WoL Request] Wake admin system from ${clientIP}`);
    
    // Check if MAC address is configured
    if (config.adminSystem.macAddress === "00:00:00:00:00:00") {
        const errorMsg = 'Admin MAC address not configured';
        addLog('wake_admin', 'error', errorMsg, clientIP);
        return res.status(400).json({
            success: false,
            error: errorMsg,
            message: 'Please configure the admin system MAC address in wol-config.json'
        });
    }
    
    // Send magic packet
    wol.wake(config.adminSystem.macAddress, (error) => {
        if (error) {
            console.error('❌ WoL error:', error);
            addLog('wake_admin', 'error', error.message, clientIP);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
        
        console.log('✓ Magic packet sent successfully');
        config.adminSystem.lastWakeTime = new Date().toISOString();
        addLog('wake_admin', 'success', 'Magic packet sent', clientIP);
        saveConfig();
        
        res.json({
            success: true,
            message: 'Wake-on-LAN packet sent to admin system',
            macAddress: config.adminSystem.macAddress,
            timestamp: config.adminSystem.lastWakeTime
        });
    });
});

// Get configuration
app.get('/api/wol/config', (req, res) => {
    res.json({
        adminSystem: {
            name: config.adminSystem.name,
            macAddress: config.adminSystem.macAddress,
            ipAddress: config.adminSystem.ipAddress,
            lastWakeTime: config.adminSystem.lastWakeTime,
            isConfigured: config.adminSystem.macAddress !== "00:00:00:00:00:00"
        }
    });
});

// Update configuration (for setup)
app.post('/api/wol/config', (req, res) => {
    const { macAddress, ipAddress, name } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Validate MAC address format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (macAddress && !macRegex.test(macAddress)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid MAC address format. Use format: XX:XX:XX:XX:XX:XX'
        });
    }
    
    if (macAddress) config.adminSystem.macAddress = macAddress;
    if (ipAddress) config.adminSystem.ipAddress = ipAddress;
    if (name) config.adminSystem.name = name;
    
    saveConfig();
    addLog('config_update', 'success', 'Configuration updated', clientIP);
    
    console.log('✓ WoL configuration updated');
    res.json({
        success: true,
        message: 'Configuration updated',
        config: config.adminSystem
    });
});

// Get logs
app.get('/api/wol/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({
        logs: config.logs.slice(0, limit)
    });
});

// Health check
app.get('/api/wol/health', (req, res) => {
    res.json({
        status: 'running',
        service: 'Wake-on-LAN',
        port: PORT,
        configured: config.adminSystem.macAddress !== "00:00:00:00:00:00"
    });
});

// ===== START SERVER =====

loadConfig();

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('Wake-on-LAN Service Started');
    console.log('='.repeat(60));
    console.log(`Port: ${PORT}`);
    console.log(`Admin MAC: ${config.adminSystem.macAddress}`);
    console.log(`Configured: ${config.adminSystem.macAddress !== "00:00:00:00:00:00" ? 'YES ✓' : 'NO ⚠'}`);
    console.log('='.repeat(60));
    console.log('\nEndpoints:');
    console.log(`  POST http://localhost:${PORT}/api/wol/wake-admin`);
    console.log(`  GET  http://localhost:${PORT}/api/wol/config`);
    console.log(`  POST http://localhost:${PORT}/api/wol/config`);
    console.log(`  GET  http://localhost:${PORT}/api/wol/logs`);
    console.log('\n');
});
