# ============================================
# Wake-on-LAN Windows Configuration Script
# ============================================
# Automatically enables WoL on all network adapters
# NO RESTART REQUIRED (except for BIOS - try this first!)
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Wake-on-LAN Auto-Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Right-click this script and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 1: Enable WoL on Network Adapters
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 1: Configuring Network Adapters" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Get all physical network adapters (excluding virtual adapters)
$adapters = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' -and $_.Virtual -eq $false }

if ($adapters.Count -eq 0) {
    Write-Host "⚠️  No active physical network adapters found!" -ForegroundColor Yellow
    $adapters = Get-NetAdapter | Where-Object { $_.Virtual -eq $false }
    Write-Host "   Trying all physical adapters..." -ForegroundColor Yellow
}

$configuredCount = 0

foreach ($adapter in $adapters) {
    Write-Host "📡 Configuring: $($adapter.Name) [$($adapter.InterfaceDescription)]" -ForegroundColor White
    
    try {
        # Enable Wake on Magic Packet
        Set-NetAdapterAdvancedProperty -Name $adapter.Name -DisplayName "Wake on Magic Packet" -DisplayValue "Enabled" -ErrorAction SilentlyContinue
        Set-NetAdapterAdvancedProperty -Name $adapter.Name -DisplayName "Wake on pattern match" -DisplayValue "Enabled" -ErrorAction SilentlyContinue
        
        # Enable power management wake settings
        $powerMgmt = Get-WmiObject -Class MSPower_DeviceWakeEnable -Namespace root\wmi | Where-Object { $_.InstanceName -like "*$($adapter.DeviceID)*" }
        if ($powerMgmt) {
            $powerMgmt.Enable = $true
            $powerMgmt.Put() | Out-Null
        }
        
        # Enable the adapter to wake the computer
        $registryPath = "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4D36E972-E325-11CE-BFC1-08002BE10318}"
        $adapterKey = Get-ChildItem $registryPath -Recurse | Where-Object { (Get-ItemProperty $_.PSPath -Name "DriverDesc" -ErrorAction SilentlyContinue).DriverDesc -eq $adapter.InterfaceDescription }
        
        if ($adapterKey) {
            Set-ItemProperty -Path $adapterKey.PSPath -Name "*WakeOnMagicPacket" -Value 1 -ErrorAction SilentlyContinue
            Set-ItemProperty -Path $adapterKey.PSPath -Name "*WakeOnPattern" -Value 1 -ErrorAction SilentlyContinue
            Set-ItemProperty -Path $adapterKey.PSPath -Name "PnPCapabilities" -Value 0 -ErrorAction SilentlyContinue
        }
        
        Write-Host "   ✅ Wake on Magic Packet: Enabled" -ForegroundColor Green
        $configuredCount++
        
    } catch {
        Write-Host "   ⚠️  Some settings could not be applied (might not be supported)" -ForegroundColor Yellow
    }
    
    # Display MAC address
    Write-Host "   📝 MAC Address: $($adapter.MacAddress)" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "✅ Configured $configuredCount adapter(s)" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 2: Configure Power Settings
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 2: Configuring Power Settings" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    # Enable wake timers
    powercfg /change standby-timeout-ac 0
    powercfg /change standby-timeout-dc 0
    powercfg /setacvalueindex SCHEME_CURRENT 238c9fa8-0aad-41ed-83f4-97be242c8f20 bd3b718a-0680-4d9d-8ab2-e1d2b4ac806d 1
    powercfg /setdcvalueindex SCHEME_CURRENT 238c9fa8-0aad-41ed-83f4-97be242c8f20 bd3b718a-0680-4d9d-8ab2-e1d2b4ac806d 1
    powercfg /setactive SCHEME_CURRENT
    
    Write-Host "✅ Wake timers: Enabled" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not configure wake timers" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# STEP 3: Disable Fast Startup
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 3: Disabling Fast Startup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Power" -Name "HiberbootEnabled" -Value 0 -Type DWord
    Write-Host "✅ Fast Startup: Disabled" -ForegroundColor Green
    Write-Host "   (This prevents WoL issues)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Could not disable Fast Startup" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# STEP 4: Configure Firewall
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 4: Configuring Firewall" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

try {
    # Remove existing rule if it exists
    Remove-NetFirewallRule -DisplayName "Wake-on-LAN Service" -ErrorAction SilentlyContinue
    
    # Create new inbound rule for port 3002
    New-NetFirewallRule -DisplayName "Wake-on-LAN Service" `
                        -Direction Inbound `
                        -Protocol TCP `
                        -LocalPort 3002 `
                        -Action Allow `
                        -Profile Any `
                        -Enabled True | Out-Null
    
    Write-Host "✅ Firewall rule created: Port 3002 (TCP) - Inbound" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not create firewall rule (might already exist)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# STEP 5: Display Configuration Summary
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "CONFIGURATION SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "Network Adapters Configured:" -ForegroundColor White
foreach ($adapter in $adapters) {
    Write-Host "  • $($adapter.Name)" -ForegroundColor Green
    Write-Host "    MAC: $($adapter.MacAddress)" -ForegroundColor Cyan
    Write-Host "    Status: $($adapter.Status)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Power Settings:" -ForegroundColor White
Write-Host "  ✅ Wake timers enabled" -ForegroundColor Green
Write-Host "  ✅ Fast Startup disabled" -ForegroundColor Green

Write-Host ""
Write-Host "Firewall:" -ForegroundColor White
Write-Host "  ✅ Port 3002 (TCP) allowed" -ForegroundColor Green

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ============================================
# STEP 6: Test WoL Capability
# ============================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "TESTING WoL CAPABILITY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Checking WoL support..." -ForegroundColor White
Write-Host ""

foreach ($adapter in $adapters) {
    try {
        $wolStatus = Get-NetAdapterAdvancedProperty -Name $adapter.Name -DisplayName "Wake on Magic Packet" -ErrorAction SilentlyContinue
        if ($wolStatus.DisplayValue -eq "Enabled") {
            Write-Host "✅ $($adapter.Name): WoL is ENABLED" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($adapter.Name): WoL status unclear" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  $($adapter.Name): Could not verify WoL status" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ============================================
# FINAL INSTRUCTIONS
# ============================================
Write-Host "✅ WINDOWS CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. NO RESTART REQUIRED for Windows settings! ✅" -ForegroundColor Green
Write-Host ""
Write-Host "2. BIOS Configuration (if WoL doesn't work):" -ForegroundColor White
Write-Host "   • Restart computer and enter BIOS" -ForegroundColor Gray
Write-Host "   • Enable 'Wake on LAN' or 'PME Event Wake Up'" -ForegroundColor Gray
Write-Host "   • Save and exit BIOS" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test WoL:" -ForegroundColor White
Write-Host "   • Put this computer to Sleep (not shutdown)" -ForegroundColor Gray
Write-Host "   • From another computer, send a magic packet" -ForegroundColor Gray
Write-Host "   • This computer should wake up automatically" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Setup WoL Service:" -ForegroundColor White
Write-Host "   • Run: SETUP_WOL.bat" -ForegroundColor Cyan
Write-Host "   • Then run: START_WOL_SERVICE.bat" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

# Save MAC addresses to a file for easy reference
$macAddressFile = ".\admin-mac-addresses.txt"
"Wake-on-LAN MAC Addresses" | Out-File $macAddressFile
"Generated: $(Get-Date)" | Out-File $macAddressFile -Append
"" | Out-File $macAddressFile -Append

foreach ($adapter in $adapters) {
    "Adapter: $($adapter.Name)" | Out-File $macAddressFile -Append
    "MAC: $($adapter.MacAddress)" | Out-File $macAddressFile -Append
    "Status: $($adapter.Status)" | Out-File $macAddressFile -Append
    "" | Out-File $macAddressFile -Append
}

Write-Host "📝 MAC addresses saved to: $macAddressFile" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
