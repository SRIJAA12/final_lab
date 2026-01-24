# Wake-on-LAN Setup Guide

## 📋 Overview
This system allows student computers to wake up the admin computer remotely using Wake-on-LAN (WoL) technology.

## 🚀 Quick Setup (5 Steps)

### Step 1: Enable Wake-on-LAN in BIOS (Admin Computer)

1. **Restart the admin computer** and enter BIOS:
   - Press `Del`, `F2`, or `F12` during startup (varies by manufacturer)

2. **Find WoL settings** (names vary):
   - Look for: "Wake on LAN", "Power On By PCI-E", "Wake on Network", or "PME Event Wake Up"
   - **Enable** the setting

3. **Save and exit** BIOS

### Step 2: Enable WoL in Windows (Admin Computer)

1. Open **Device Manager** (Win + X → Device Manager)
2. Expand **Network adapters**
3. Right-click your network adapter → **Properties**
4. Go to **Power Management** tab:
   - ✓ Check "Allow this device to wake the computer"
   - ✓ Check "Only allow a magic packet to wake the computer"
5. Go to **Advanced** tab:
   - Find "Wake on Magic Packet" → Set to **Enabled**
6. Click **OK**

### Step 3: Install WoL Package (Admin Computer)

Open Command Prompt in admin server directory and run:
```batch
cd d:\screen_mirror_deployment\central-admin\server
npm install wake_on_lan --save
```

Or simply run:
```batch
SETUP_WOL.bat
```

### Step 4: Configure Admin MAC Address

Run the setup wizard:
```batch
SETUP_WOL.bat
```

The wizard will:
- Detect your network interfaces automatically
- Ask you to select or enter the admin MAC address
- Save the configuration

**OR** manually edit `central-admin\server\wol-config.json`:
```json
{
  "adminSystem": {
    "name": "Admin Computer",
    "macAddress": "XX:XX:XX:XX:XX:XX",  ← Change this to your actual MAC
    "ipAddress": "192.168.1.100",
    "lastWakeTime": null
  }
}
```

**To find your MAC address:**
- Open Command Prompt
- Run: `ipconfig /all`
- Look for "Physical Address" under your active network adapter
- Format: `XX-XX-XX-XX-XX-XX` or `XX:XX:XX:XX:XX:XX`

### Step 5: Start the WoL Service (Admin Computer)

Run:
```batch
START_WOL_SERVICE.bat
```

The service will start on port **3002**.

---

## 🖥️ Using from Student Systems

### Option A: Use the Wake Button Page

1. **Copy the wake button file** to each student system:
   ```
   student-kiosk\wake-admin-button.html
   ```

2. **Edit the file** and update the admin server IP:
   ```javascript
   const WOL_SERVER_URL = 'http://192.168.1.100:3002'; // ← Your admin IP
   ```

3. **Open the file** in a browser
4. Click "**Wake Up Admin**" button

### Option B: Use Command Line (PowerShell)

```powershell
# Send wake request
Invoke-RestMethod -Uri "http://192.168.1.100:3002/api/wol/wake-admin" -Method POST
```

### Option C: Integrate into Existing Student Kiosk

Add this button to your student kiosk interface:

```html
<button onclick="wakeAdminSystem()">Wake Admin Computer</button>

<script>
async function wakeAdminSystem() {
    try {
        const response = await fetch('http://192.168.1.100:3002/api/wol/wake-admin', {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            alert('✓ Admin system wake signal sent!');
        } else {
            alert('❌ Error: ' + data.error);
        }
    } catch (error) {
        alert('❌ Cannot connect to WoL service');
    }
}
</script>
```

---

## 📡 API Endpoints

The WoL service provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wol/wake-admin` | POST | Send wake signal to admin system |
| `/api/wol/config` | GET | Get current configuration |
| `/api/wol/config` | POST | Update configuration |
| `/api/wol/logs` | GET | View wake attempt logs |
| `/api/wol/health` | GET | Check service status |

---

## 🔍 Testing

### Test from Admin Computer (localhost):
```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/wol/wake-admin" -Method POST
```

### Test from Student Computer:
```powershell
Invoke-RestMethod -Uri "http://192.168.1.100:3002/api/wol/wake-admin" -Method POST
```

### Check service status:
```powershell
Invoke-RestMethod -Uri "http://192.168.1.100:3002/api/wol/health" -Method GET
```

---

## ⚙️ Advanced Configuration

### Run WoL Service on Startup

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a shortcut to `START_WOL_SERVICE.bat`
3. The service will auto-start on boot

### Change WoL Service Port

Edit `wake-on-lan-service.js`:
```javascript
const PORT = 3002; // Change to desired port
```

### View Logs

```powershell
Invoke-RestMethod -Uri "http://192.168.1.100:3002/api/wol/logs" -Method GET
```

Or check `central-admin\server\wol-config.json` - logs are stored there.

---

## 🐛 Troubleshooting

### Admin computer doesn't wake up?

1. **Check BIOS settings** - WoL must be enabled
2. **Check Windows settings** - Network adapter must allow wake
3. **Check MAC address** - Must be correct in `wol-config.json`
4. **Check network** - Admin and student must be on same network/subnet
5. **Check power** - Computer must be in sleep/hibernation, not completely off (some PCs)
6. **Check firewall** - Port 3002 must be open (or change port)

### Cannot connect to WoL service?

1. **Check if service is running** - Should see "Wake-on-LAN Service Started"
2. **Check IP address** - Use correct admin server IP
3. **Check port** - Default is 3002
4. **Check firewall** - Allow port 3002 on admin computer

### Get "Admin MAC address not configured" error?

Run `SETUP_WOL.bat` again or manually edit `wol-config.json` with correct MAC address.

---

## 📁 Files Created

| File | Location | Purpose |
|------|----------|---------|
| `wake-on-lan-service.js` | `central-admin/server/` | Main WoL service |
| `wol-setup.js` | `central-admin/server/` | Setup wizard |
| `wol-config.json` | `central-admin/server/` | Configuration & logs |
| `wake-admin-button.html` | `student-kiosk/` | Student interface |
| `START_WOL_SERVICE.bat` | Root | Service launcher |
| `SETUP_WOL.bat` | Root | Setup wizard launcher |

---

## ✅ Checklist

- [ ] WoL enabled in BIOS
- [ ] WoL enabled in Windows Device Manager
- [ ] `wake_on_lan` npm package installed
- [ ] MAC address configured in `wol-config.json`
- [ ] WoL service running on admin computer (port 3002)
- [ ] Student systems can access admin IP on port 3002
- [ ] Tested wake functionality

---

## 💡 How It Works

1. **Student clicks "Wake Admin"** button
2. **HTTP request** sent to admin WoL service (port 3002)
3. **Service sends "magic packet"** to admin MAC address
4. **Network card receives packet** and powers on computer
5. **Computer boots up** automatically

**Note:** The admin computer must support Wake-on-LAN (most modern computers do) and must be connected via Ethernet (Wi-Fi WoL is unreliable).

---

## 🔒 Security Notes

- WoL service runs on **local network only**
- No authentication required (trusted network assumed)
- To add authentication, modify `wake-on-lan-service.js`
- Magic packets are broadcast on local network
- No sensitive data transmitted

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. View logs: `http://[admin-ip]:3002/api/wol/logs`
3. Check service health: `http://[admin-ip]:3002/api/wol/health`
4. Verify MAC address format is correct (XX:XX:XX:XX:XX:XX)

---

**Created:** January 2026  
**Version:** 1.0  
**Standalone:** Does not modify existing code
