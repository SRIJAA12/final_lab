# Kiosk Key Blocker - Compiles and runs a C# exe to block Windows key + Alt+Tab
# The .exe approach is MORE RELIABLE than PowerShell hooks
# Run with: powershell -ExecutionPolicy Bypass -NoProfile -File block_keys.ps1

$csCode = @'
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

class KioskBlocker
{
    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);

    [DllImport("user32.dll")]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

    [DllImport("kernel32.dll")]
    private static extern IntPtr GetModuleHandle(string lpModuleName);

    [DllImport("user32.dll")]
    private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    private static IntPtr hookId = IntPtr.Zero;
    private static LowLevelKeyboardProc proc = HookCallback;

    static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
    {
        if (nCode >= 0)
        {
            int vk = Marshal.ReadInt32(lParam);
            int flags = Marshal.ReadInt32(lParam, 8);

            // Block Windows keys
            if (vk == 0x5B || vk == 0x5C) return (IntPtr)1;

            // Block Alt+Tab
            if (vk == 0x09 && (flags & 0x20) != 0) return (IntPtr)1;

            // Block Alt+Esc
            if (vk == 0x1B && (flags & 0x20) != 0) return (IntPtr)1;

            // Block Ctrl+Esc (Start menu)
            if (vk == 0x1B && (Control.ModifierKeys & Keys.Control) != 0) return (IntPtr)1;
        }
        return CallNextHookEx(hookId, nCode, wParam, lParam);
    }

    [STAThread]
    static void Main()
    {
        // Hide taskbar
        IntPtr tb = FindWindow("Shell_TrayWnd", null);
        if (tb != IntPtr.Zero) ShowWindow(tb, 0);
        IntPtr sb = FindWindow("Button", "Start");
        if (sb != IntPtr.Zero) ShowWindow(sb, 0);

        // Get module handle for the hook
        using (Process p = Process.GetCurrentProcess())
        using (ProcessModule m = p.MainModule)
        {
            hookId = SetWindowsHookEx(13, proc, GetModuleHandle(m.ModuleName), 0);
        }

        if (hookId == IntPtr.Zero)
        {
            Console.WriteLine("HOOK_FAILED");
            return;
        }

        Console.WriteLine("BLOCKING_ACTIVE");
        Application.Run();
    }
}
'@

# Find csc.exe (C# compiler - built into every Windows)
$cscPaths = @(
    "$env:windir\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
    "$env:windir\Microsoft.NET\Framework\v4.0.30319\csc.exe",
    "$env:windir\Microsoft.NET\Framework64\v3.5\csc.exe",
    "$env:windir\Microsoft.NET\Framework\v3.5\csc.exe"
)

$csc = $null
foreach ($p in $cscPaths) {
    if (Test-Path $p) { $csc = $p; break }
}

if (-not $csc) {
    Write-Host "ERROR: csc.exe not found"
    exit 1
}

# Compile to exe in temp folder
$csFile = "$env:TEMP\kiosk_blocker.cs"
$exeFile = "$env:TEMP\kiosk_blocker.exe"

# Kill any existing blocker first (prevents file lock on recompile)
try {
    $existing = Get-Process -Name "kiosk_blocker" -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Killing existing kiosk_blocker.exe..."
        Stop-Process -Name "kiosk_blocker" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
} catch { }

# Always recompile to ensure latest code
$csCode | Out-File -FilePath $csFile -Encoding UTF8 -Force

Write-Host "Compiling with: $csc"
$result = & $csc /nologo /target:winexe /reference:System.Windows.Forms.dll /out:$exeFile $csFile 2>&1

if (-not (Test-Path $exeFile)) {
    Write-Host "COMPILE FAILED:"
    Write-Host $result
    exit 1
}

Write-Host "COMPILED OK - Starting blocker..."

# Run the compiled exe (blocks until killed)
& $exeFile
