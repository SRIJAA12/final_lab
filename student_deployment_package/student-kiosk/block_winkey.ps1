Add-Type @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Windows.Forms;

public class WinKeyBlocker {
    private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
    
    [DllImport("user32.dll", SetLastError = true)]
    private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);
    
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool UnhookWindowsHookEx(IntPtr hhk);
    
    [DllImport("user32.dll")]
    private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);
    
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern IntPtr GetModuleHandle(string lpModuleName);
    
    [DllImport("user32.dll")]
    private static extern short GetAsyncKeyState(int vKey);
    
    [DllImport("user32.dll")]
    private static extern IntPtr FindWindow(string className, string windowName);
    
    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    
    private const int WH_KEYBOARD_LL = 13;
    private const int WM_KEYDOWN = 0x0100;
    private const int WM_SYSKEYDOWN = 0x0104;
    private const int VK_LWIN = 0x5B;
    private const int VK_RWIN = 0x5C;
    private const int VK_ESCAPE = 0x1B;
    private const int VK_TAB = 0x09;
    private const int VK_CONTROL = 0x11;
    
    private static IntPtr hookId = IntPtr.Zero;
    private static LowLevelKeyboardProc proc = HookCallback;
    
    public static void Start() {
        // Hide taskbar
        IntPtr taskbar = FindWindow("Shell_TrayWnd", null);
        if (taskbar != IntPtr.Zero) ShowWindow(taskbar, 0);
        
        // Install hook
        using (Process curProcess = Process.GetCurrentProcess())
        using (ProcessModule curModule = curProcess.MainModule) {
            hookId = SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
        }
        
        // Run message loop
        Application.Run();
        
        // Cleanup on exit
        if (hookId != IntPtr.Zero) UnhookWindowsHookEx(hookId);
        
        // Restore taskbar
        taskbar = FindWindow("Shell_TrayWnd", null);
        if (taskbar != IntPtr.Zero) ShowWindow(taskbar, 5);
    }
    
    public static void Stop() {
        Application.Exit();
    }
    
    private static IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam) {
        if (nCode >= 0 && (wParam == (IntPtr)WM_KEYDOWN || wParam == (IntPtr)WM_SYSKEYDOWN)) {
            int vkCode = Marshal.ReadInt32(lParam);
            
            // Block Windows keys
            if (vkCode == VK_LWIN || vkCode == VK_RWIN) {
                return (IntPtr)1;
            }
            
            // Block Ctrl+Escape (Start menu)
            if (vkCode == VK_ESCAPE && (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0) {
                return (IntPtr)1;
            }
        }
        return CallNextHookEx(hookId, nCode, wParam, lParam);
    }
}
"@ -ReferencedAssemblies System.Windows.Forms

Write-Host "=== KIOSK KEY BLOCKER STARTED ==="
Write-Host "Windows key, Ctrl+Esc, Taskbar BLOCKED"
Write-Host "This window will stay open while kiosk runs."
Write-Host "Close this window to RESTORE Windows key."

# Register cleanup on exit
Register-EngineEvent PowerShell.Exiting -Action {
    [WinKeyBlocker]::Stop()
    $taskbar = [System.Runtime.InteropServices.Marshal]::ReadIntPtr((& { 
        Add-Type -TypeDefinition "using System; using System.Runtime.InteropServices; public class W { [DllImport(`"user32.dll`")] public static extern IntPtr FindWindow(string c, string w); }" -PassThru
    })::FindWindow("Shell_TrayWnd", $null))
} -SupportEvent

# Start blocking (runs until window is closed)
[WinKeyBlocker]::Start()

# Restore taskbar when script ends
Write-Host "=== KEY BLOCKER STOPPED - Windows key RESTORED ==="
