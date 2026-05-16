@echo off
:: ============================================
:: UNBLOCK Windows key, Alt+Tab, Show Taskbar
:: Used after student LOGIN succeeds
:: ============================================

echo Stopping key blocker...

:: Kill PowerShell processes running block_keys.ps1
for /f "tokens=2 delims=," %%a in ('wmic process where "commandline like '%%block_keys.ps1%%'" get processid /format:csv 2^>nul ^| findstr /r "[0-9]"') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: Show taskbar again
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Add-Type -Name TBR -Namespace KR -MemberDefinition '[DllImport(\"user32.dll\")] public static extern IntPtr FindWindow(string c, string w); [DllImport(\"user32.dll\")] public static extern bool ShowWindow(IntPtr h, int s);'; [KR.TBR]::ShowWindow([KR.TBR]::FindWindow('Shell_TrayWnd',$null), 5); [KR.TBR]::ShowWindow([KR.TBR]::FindWindow('Button','Start'), 5)"

echo.
echo ==========================================
echo  Windows key   = RESTORED
echo  Alt+Tab       = RESTORED
echo  Taskbar       = VISIBLE
echo ==========================================
