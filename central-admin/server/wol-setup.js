/**
 * Wake-on-LAN Setup Utility
 * Interactive setup for configuring admin system MAC address
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(__dirname, 'wol-config.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Get local MAC addresses
function getLocalMACAddresses() {
    const interfaces = os.networkInterfaces();
    const macs = [];
    
    for (const [name, addrs] of Object.entries(interfaces)) {
        for (const addr of addrs) {
            if (addr.mac && addr.mac !== '00:00:00:00:00:00' && !addr.internal) {
                macs.push({
                    interface: name,
                    mac: addr.mac,
                    ip: addr.address,
                    family: addr.family
                });
            }
        }
    }
    
    return macs;
}

async function setup() {
    console.log('\n' + '='.repeat(60));
    console.log('Wake-on-LAN Configuration Setup');
    console.log('='.repeat(60) + '\n');
    
    // Detect local MACs
    console.log('Detecting network interfaces...\n');
    const localMACs = getLocalMACAddresses();
    
    if (localMACs.length > 0) {
        console.log('Found network interfaces:');
        localMACs.forEach((mac, index) => {
            console.log(`  [${index + 1}] ${mac.interface}`);
            console.log(`      MAC: ${mac.mac}`);
            console.log(`      IP:  ${mac.ip} (${mac.family})`);
            console.log('');
        });
    }
    
    console.log('This setup will configure the ADMIN system MAC address');
    console.log('that student systems will wake up.\n');
    
    // Get admin system name
    const systemName = await question('Admin system name [Admin Computer]: ');
    const name = systemName.trim() || 'Admin Computer';
    
    // Get MAC address
    let macAddress = '';
    if (localMACs.length > 0) {
        const choice = await question(`\nSelect interface (1-${localMACs.length}) or enter MAC manually: `);
        const choiceNum = parseInt(choice);
        
        if (choiceNum >= 1 && choiceNum <= localMACs.length) {
            macAddress = localMACs[choiceNum - 1].mac;
            console.log(`✓ Selected: ${macAddress}`);
        } else {
            macAddress = choice.trim();
        }
    } else {
        macAddress = await question('Enter admin system MAC address (XX:XX:XX:XX:XX:XX): ');
    }
    
    // Validate MAC
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress)) {
        console.log('\n❌ Invalid MAC address format!');
        console.log('Please use format: XX:XX:XX:XX:XX:XX (e.g., 00:1A:2B:3C:4D:5E)');
        rl.close();
        return;
    }
    
    // Get IP address (optional)
    const ipAddress = await question('Admin system IP address (optional, for reference): ');
    
    // Create configuration
    const config = {
        adminSystem: {
            name: name,
            macAddress: macAddress,
            ipAddress: ipAddress.trim() || '192.168.1.100',
            lastWakeTime: null
        },
        studentSystems: [],
        logs: []
    };
    
    // Save configuration
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('✓ Configuration saved successfully!');
        console.log('='.repeat(60));
        console.log('\nConfiguration:');
        console.log(`  Name: ${config.adminSystem.name}`);
        console.log(`  MAC:  ${config.adminSystem.macAddress}`);
        console.log(`  IP:   ${config.adminSystem.ipAddress}`);
        console.log('\nNext steps:');
        console.log('  1. Make sure Wake-on-LAN is enabled in BIOS');
        console.log('  2. Start the WoL service: node wake-on-lan-service.js');
        console.log('  3. Test from student system or browser\n');
        
    } catch (error) {
        console.error('\n❌ Error saving configuration:', error.message);
    }
    
    rl.close();
}

// Enable Wake-on-LAN instructions
function showWoLInstructions() {
    console.log('\n' + '='.repeat(60));
    console.log('How to Enable Wake-on-LAN in BIOS');
    console.log('='.repeat(60));
    console.log('\n1. Restart computer and enter BIOS (usually Del, F2, or F12)');
    console.log('2. Look for these settings (names vary by manufacturer):');
    console.log('   - Wake on LAN');
    console.log('   - Power On By PCI-E Device');
    console.log('   - Wake on Network');
    console.log('   - PME Event Wake Up');
    console.log('3. Enable the setting');
    console.log('4. Save and exit BIOS');
    console.log('\n5. In Windows, also check:');
    console.log('   - Device Manager → Network Adapter → Properties');
    console.log('   - Power Management tab → "Allow this device to wake computer"');
    console.log('   - Advanced tab → Wake on Magic Packet → Enabled\n');
}

setup().catch(console.error);
