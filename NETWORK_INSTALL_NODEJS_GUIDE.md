# 📦 Network Installation of Node.js - Step by Step

## 🎯 Goal
Install Node.js on all 60 student systems from one shared location on the admin system.

---

## 📋 PART 1: SETUP ON ADMIN SYSTEM (One Time)

### Step 1: Create Shared Folder

**On the admin system (192.168.1.1):**

1. **Create a folder for installers:**
   ```powershell
   # Open PowerShell as Administrator
   mkdir C:\LabInstall
   ```

2. **Copy Node.js installer to this folder:**
   - Download Node.js from: https://nodejs.org/
   - Get the **Windows 64-bit (.msi)** installer
   - File will be named like: `node-v18.19.0-x64.msi`
   - Copy it to: `C:\LabInstall\node-v18.19.0-x64.msi`

3. **Share the folder on the network:**

   **Option A: Using PowerShell (Recommended):**
   ```powershell
   # Run as Administrator
   New-SmbShare -Name "LabInstall" -Path "C:\LabInstall" -ReadAccess "Everyone"
   ```

   **Option B: Using GUI:**
   - Right-click `C:\LabInstall` folder
   - Select "Properties"
   - Click "Sharing" tab
   - Click "Share..." button
   - Add "Everyone" from the dropdown
   - Set permission level to "Read"
   - Click "Share"
   - You'll see: `\\192.168.1.1\LabInstall`

4. **Verify the share is accessible:**
   ```powershell
   # Check if share exists
   Get-SmbShare -Name LabInstall
   
   # Should show:
   # Name       ScopeName Path           Description
   # ----       --------- ----           -----------
   # LabInstall *         C:\LabInstall
   ```

5. **Configure Windows Firewall to allow file sharing:**
   ```powershell
   # Run as Administrator
   netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes
   ```

---

## 🖥️ PART 2: TEST FROM ONE STUDENT SYSTEM

**Before installing on all 60 systems, test on ONE student PC first!**

### Step 1: Access the Shared Folder

**On student system (e.g., 192.168.1.2):**

1. **Open File Explorer:**
   - Press `Win + E`
   - In the address bar, type:
     ```
     \\192.168.1.1\LabInstall
     ```
   - Press Enter

2. **You should see:**
   - The Node.js installer file: `node-v18.19.0-x64.msi`

3. **If you can't access it:**
   - Ping the admin system: `ping 192.168.1.1`
   - Check if File and Printer Sharing is enabled
   - Check Windows Firewall on admin system

### Step 2: Test Silent Installation

**On the same student system:**

1. **Open PowerShell as Administrator:**
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)"

2. **Run the silent installation:**
   ```powershell
   # Replace version number with your actual file name
   \\192.168.1.1\LabInstall\node-v18.19.0-x64.msi /quiet /norestart
   ```

3. **Wait for installation:**
   - This will take 1-2 minutes
   - No window will appear (silent install)
   - You'll see the prompt return when done

4. **Verify installation:**
   ```powershell
   # Refresh environment variables
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   
   # Check Node.js version
   node --version
   
   # Should show: v18.19.0 (or your version)
   ```

5. **If verification fails:**
   - Close PowerShell completely
   - Open a NEW PowerShell window
   - Try `node --version` again

**If this test works, proceed to install on all systems!**

---

## 🚀 PART 3: INSTALL ON ALL 60 STUDENT SYSTEMS

### Method 1: Manual Visit to Each PC (Most Reliable)

**Go to each student PC and run:**

1. **Open PowerShell as Administrator**
2. **Run this command:**
   ```powershell
   \\192.168.1.1\LabInstall\node-v18.19.0-x64.msi /quiet /norestart
   ```
3. **Wait 2 minutes**
4. **Verify:** `node --version`
5. **Move to next PC**

**Pros:** Simple, reliable, you can see if each one works
**Cons:** Time-consuming (5 min per PC = 5 hours total)

---

### Method 2: Using Remote PowerShell (Faster, Requires Setup)

**Prerequisites:**
- Windows Remote Management (WinRM) must be enabled on all student PCs
- You need administrator credentials

#### Enable WinRM on All Student Systems First:

**On EACH student system (or use Group Policy):**
```powershell
# Run as Administrator
Enable-PSRemoting -Force
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "192.168.1.1" -Force
```

#### Then Install from Admin System:

**On admin system, create this script:**

Save as `C:\LabInstall\install-nodejs-all.ps1`:

```powershell
# Configuration
$AdminIP = "192.168.1.1"
$NodeInstaller = "node-v18.19.0-x64.msi"
$InstallerPath = "\\$AdminIP\LabInstall\$NodeInstaller"

# List of student IPs
$StudentIPs = @()
for ($i = 2; $i -le 61; $i++) {
    $StudentIPs += "192.168.1.$i"
}

Write-Host "================================================"
Write-Host "  Installing Node.js on $($StudentIPs.Count) systems"
Write-Host "================================================"
Write-Host ""

$successCount = 0
$failCount = 0
$results = @()

foreach ($ip in $StudentIPs) {
    Write-Host "[Processing] $ip..." -NoNewline
    
    try {
        # Test if system is online
        if (Test-Connection -ComputerName $ip -Count 1 -Quiet -ErrorAction Stop) {
            
            # Create remote session
            $session = New-PSSession -ComputerName $ip -ErrorAction Stop
            
            # Run installation remotely
            Invoke-Command -Session $session -ScriptBlock {
                param($InstallerPath)
                
                # Run silent install
                Start-Process "msiexec.exe" -ArgumentList "/i `"$InstallerPath`" /quiet /norestart" -Wait -NoNewWindow
                
                # Verify installation
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
                $nodeVersion = & node --version 2>&1
                
                return $nodeVersion
            } -ArgumentList $InstallerPath
            
            Remove-PSSession $session
            
            Write-Host " ✅ SUCCESS" -ForegroundColor Green
            $successCount++
            $results += [PSCustomObject]@{
                IP = $ip
                Status = "Success"
                Message = "Installed"
            }
        }
        else {
            Write-Host " ❌ OFFLINE" -ForegroundColor Red
            $failCount++
            $results += [PSCustomObject]@{
                IP = $ip
                Status = "Failed"
                Message = "System offline"
            }
        }
    }
    catch {
        Write-Host " ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
        $results += [PSCustomObject]@{
            IP = $ip
            Status = "Failed"
            Message = $_.Exception.Message
        }
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "================================================"
Write-Host "  INSTALLATION SUMMARY"
Write-Host "================================================"
Write-Host "Total Systems: $($StudentIPs.Count)"
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red
Write-Host ""

# Show failed systems
if ($failCount -gt 0) {
    Write-Host "Failed Systems:" -ForegroundColor Yellow
    $results | Where-Object { $_.Status -eq "Failed" } | Format-Table -AutoSize
}

# Export results
$results | Export-Csv -Path "C:\LabInstall\nodejs-install-results.csv" -NoTypeInformation
Write-Host "Results saved to: C:\LabInstall\nodejs-install-results.csv"
```

**Run the script:**
```powershell
# On admin system, run as Administrator
powershell -ExecutionPolicy Bypass -File "C:\LabInstall\install-nodejs-all.ps1"
```

**This will:**
- Check each student system (192.168.1.2 to 192.168.1.61)
- Install Node.js silently on each
- Show progress and summary
- Save results to CSV

---

### Method 3: Create USB Installer Script (For Systems Without WinRM)

**Create a simple installer script:**

Save as `C:\LabInstall\install-nodejs-local.bat`:

```batch
@echo off
echo ================================================
echo   Installing Node.js
echo ================================================
echo.

echo [1/2] Copying installer...
mkdir C:\Temp 2>nul
copy "\\192.168.1.1\LabInstall\node-v18.19.0-x64.msi" "C:\Temp\" /Y

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to copy installer from network
    echo Please check network connection to 192.168.1.1
    pause
    exit /b 1
)

echo [2/2] Installing Node.js (this takes 2 minutes)...
msiexec /i "C:\Temp\node-v18.19.0-x64.msi" /quiet /norestart

timeout /t 120 /nobreak

echo.
echo [3/3] Verifying installation...
call node --version

if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js installed successfully!
) else (
    echo ⚠️  Installation complete, but verification failed
    echo Please close this window and try: node --version
)

echo.
echo Cleaning up temporary files...
del "C:\Temp\node-v18.19.0-x64.msi"

echo.
pause
```

**Deploy this script:**
1. Copy `install-nodejs-local.bat` to USB drive
2. Go to each student PC
3. Run the batch file as Administrator
4. It will automatically grab Node.js from network and install

---

## ✅ VERIFICATION

### Check All Installations:

**Create this verification script:**

Save as `C:\LabInstall\verify-nodejs-all.ps1`:

```powershell
# List of student IPs
$StudentIPs = @()
for ($i = 2; $i -le 61; $i++) {
    $StudentIPs += "192.168.1.$i"
}

Write-Host "Checking Node.js on all systems..." -ForegroundColor Cyan
Write-Host ""

$results = @()

foreach ($ip in $StudentIPs) {
    Write-Host "Checking $ip..." -NoNewline
    
    try {
        if (Test-Connection -ComputerName $ip -Count 1 -Quiet) {
            $session = New-PSSession -ComputerName $ip -ErrorAction Stop
            
            $version = Invoke-Command -Session $session -ScriptBlock {
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
                & node --version 2>&1
            }
            
            Remove-PSSession $session
            
            if ($version -match "v\d+\.\d+\.\d+") {
                Write-Host " ✅ $version" -ForegroundColor Green
                $results += [PSCustomObject]@{
                    IP = $ip
                    Status = "Installed"
                    Version = $version
                }
            }
            else {
                Write-Host " ❌ Not installed" -ForegroundColor Red
                $results += [PSCustomObject]@{
                    IP = $ip
                    Status = "Missing"
                    Version = "N/A"
                }
            }
        }
        else {
            Write-Host " ⚠️  Offline" -ForegroundColor Yellow
            $results += [PSCustomObject]@{
                IP = $ip
                Status = "Offline"
                Version = "N/A"
            }
        }
    }
    catch {
        Write-Host " ❌ Error" -ForegroundColor Red
        $results += [PSCustomObject]@{
            IP = $ip
            Status = "Error"
            Version = $_.Exception.Message
        }
    }
}

Write-Host ""
Write-Host "================================================"
$installed = ($results | Where-Object { $_.Status -eq "Installed" }).Count
$missing = ($results | Where-Object { $_.Status -eq "Missing" }).Count
$offline = ($results | Where-Object { $_.Status -eq "Offline" }).Count

Write-Host "Installed: $installed / $($StudentIPs.Count)" -ForegroundColor Green
Write-Host "Missing: $missing" -ForegroundColor $(if($missing -gt 0){"Red"}else{"Green"})
Write-Host "Offline: $offline" -ForegroundColor Yellow

$results | Export-Csv -Path "C:\LabInstall\nodejs-verification.csv" -NoTypeInformation
Write-Host ""
Write-Host "Results saved to: C:\LabInstall\nodejs-verification.csv"
```

---

## 🐛 TROUBLESHOOTING

### Can't Access Shared Folder

**Problem:** `\\192.168.1.1\LabInstall` doesn't open

**Solutions:**

1. **Check network connection:**
   ```powershell
   ping 192.168.1.1
   ```

2. **Check if share exists:**
   ```powershell
   # On admin system
   Get-SmbShare | Where-Object { $_.Name -eq "LabInstall" }
   ```

3. **Check firewall on admin system:**
   ```powershell
   # Run as Administrator on admin system
   netsh advfirewall firewall set rule group="File and Printer Sharing" new enable=Yes
   ```

4. **Try accessing with IP:**
   ```powershell
   # Instead of computer name, use IP
   \\192.168.1.1\LabInstall
   ```

5. **Check network discovery:**
   - On admin system: Settings → Network & Internet → Sharing options
   - Turn ON: "Network discovery" and "File and printer sharing"

### Silent Install Fails

**Problem:** Installation doesn't work or hangs

**Solutions:**

1. **Check if MSI is valid:**
   ```powershell
   # Try regular install first
   \\192.168.1.1\LabInstall\node-v18.19.0-x64.msi
   ```

2. **View install logs:**
   ```powershell
   # Run with logging
   msiexec /i "\\192.168.1.1\LabInstall\node-v18.19.0-x64.msi" /quiet /norestart /log "C:\Temp\nodejs-install.log"
   
   # Then check log
   notepad C:\Temp\nodejs-install.log
   ```

3. **Try without /quiet to see errors:**
   ```powershell
   msiexec /i "\\192.168.1.1\LabInstall\node-v18.19.0-x64.msi" /norestart
   ```

### Remote PowerShell Not Working

**Problem:** Cannot connect via remote PowerShell

**Enable WinRM on student systems:**
```powershell
# On each student PC, run as Administrator
Enable-PSRemoting -Force
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "*" -Force
Restart-Service WinRM
```

---

## 📊 SUMMARY

### Recommended Approach:

**For 60 systems, I recommend Method 1 + Batch Script:**

1. **Setup:** Create shared folder on admin (5 min)
2. **Test:** Install on 1 student PC to verify (5 min)
3. **Deploy:** Use USB with batch script, visit each PC (2-3 min each = 3 hours total)
4. **Verify:** Run verification script (5 min)

**Total Time:** ~4 hours for all 60 systems

### Quick Commands Reference:

```powershell
# On Admin System - Create Share
New-SmbShare -Name "LabInstall" -Path "C:\LabInstall" -ReadAccess "Everyone"

# On Student System - Install Node.js
\\192.168.1.1\LabInstall\node-v18.19.0-x64.msi /quiet /norestart

# Verify Installation
node --version
```

---

**Need Help?** Check the troubleshooting section or test on one PC first before deploying to all!
