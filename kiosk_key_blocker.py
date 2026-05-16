"""
Kiosk Key Blocker - Disables Windows key and Start menu ONLY during kiosk mode.
Runs in the background and auto-exits when kiosk closes.
Also hides taskbar and blocks mouse clicks on Start button.
"""

import ctypes
import ctypes.wintypes
import threading
import time
import subprocess
import sys
import os
import signal
import winreg  # For registry manipulation

# ============================================================
# Windows API Constants
# ============================================================
WH_KEYBOARD_LL = 13
WH_MOUSE_LL = 14
WM_KEYDOWN = 0x0100
WM_KEYUP = 0x0101
WM_SYSKEYDOWN = 0x0104
WM_SYSKEYUP = 0x0105
WM_LBUTTONDOWN = 0x0201
WM_RBUTTONDOWN = 0x0204
VK_LWIN = 0x5B
VK_RWIN = 0x5C
VK_ESCAPE = 0x1B
VK_TAB = 0x09
VK_F4 = 0x73
VK_DELETE = 0x2E
VK_D = 0x44
VK_E = 0x45
VK_R = 0x52
VK_L = 0x4C

# Taskbar manipulation
SW_HIDE = 0
SW_SHOW = 5
SWP_NOMOVE = 0x0002
SWP_NOSIZE = 0x0001
SWP_NOZORDER = 0x0004
GWL_EXSTYLE = -20
WS_EX_TOOLWINDOW = 0x00000080
HWND_TOPMOST = -1

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

# ============================================================
# Hook callback types
# ============================================================
HOOKPROC = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_int, ctypes.wintypes.WPARAM, ctypes.wintypes.LPARAM)

class KBDLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("vkCode", ctypes.wintypes.DWORD),
        ("scanCode", ctypes.wintypes.DWORD),
        ("flags", ctypes.wintypes.DWORD),
        ("time", ctypes.wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong)),
    ]

class MSLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("pt", ctypes.wintypes.POINT),
        ("mouseData", ctypes.wintypes.DWORD),
        ("flags", ctypes.wintypes.DWORD),
        ("time", ctypes.wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong)),
    ]

# ============================================================
# Global state
# ============================================================
kiosk_running = True
keyboard_hook = None
mouse_hook = None
win_key_pressed = False

# BLOCKED key combos involving Win key
BLOCKED_KEYS = {VK_LWIN, VK_RWIN}

# Registry key for Windows key blocking
REGISTRY_PATH = r"SYSTEM\CurrentControlSet\Control\Keyboard Layout"
REGISTRY_VALUE = "Scancode Map"
# This scancode map disables both Left and Right Windows keys
DISABLE_WINKEY_DATA = bytes([
    0x00, 0x00, 0x00, 0x00,  # Header: Version (00 00 00 00)
    0x00, 0x00, 0x00, 0x00,  # Header: Flags (00 00 00 00)
    0x03, 0x00, 0x00, 0x00,  # 3 mappings (including null terminator)
    0x00, 0x00, 0x5B, 0xE0,  # Disable Left Windows key (5B E0 -> 00 00)
    0x00, 0x00, 0x5C, 0xE0,  # Disable Right Windows key (5C E0 -> 00 00)
    0x00, 0x00, 0x00, 0x00   # Null terminator
])

registry_modified = False  # Track if we modified registry


def disable_windows_key_registry():
    """Disable Windows key at OS level via registry (takes effect immediately in most cases)."""
    global registry_modified
    try:
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, REGISTRY_PATH, 0, winreg.KEY_SET_VALUE | winreg.KEY_QUERY_VALUE)
        
        # Check if already disabled
        try:
            existing_value = winreg.QueryValueEx(key, REGISTRY_VALUE)[0]
            if existing_value == DISABLE_WINKEY_DATA:
                print("ℹ️  Windows key already disabled in registry")
                winreg.CloseKey(key)
                return True
        except FileNotFoundError:
            pass  # Value doesn't exist yet, we'll create it
        
        # Set the scancode map to disable Windows key
        winreg.SetValueEx(key, REGISTRY_VALUE, 0, winreg.REG_BINARY, DISABLE_WINKEY_DATA)
        winreg.CloseKey(key)
        registry_modified = True
        print("✅ Windows key DISABLED in registry (OS-level block)")
        return True
    except PermissionError:
        print("⚠️  Registry modification failed - Need Administrator privileges")
        print("   Windows key blocking will use hook method only (less reliable)")
        return False
    except Exception as e:
        print(f"⚠️  Registry modification failed: {e}")
        return False


def restore_windows_key_registry():
    """Re-enable Windows key by removing registry entry."""
    global registry_modified
    if not registry_modified:
        return  # We didn't modify it, so don't touch it
    
    try:
        key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, REGISTRY_PATH, 0, winreg.KEY_SET_VALUE)
        try:
            winreg.DeleteValue(key, REGISTRY_VALUE)
            print("✅ Windows key RESTORED in registry")
        except FileNotFoundError:
            pass  # Value already doesn't exist
        winreg.CloseKey(key)
        registry_modified = False
    except PermissionError:
        print("⚠️  Could not restore Windows key - Need Administrator privileges")
        print("   Run: REG DELETE \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Keyboard Layout\" /v \"Scancode Map\" /f")
    except Exception as e:
        print(f"⚠️  Failed to restore registry: {e}")


def get_taskbar_handle():
    """Get the taskbar window handle."""
    return user32.FindWindowW("Shell_TrayWnd", None)


def get_start_button_handle():
    """Get the Start button handle."""
    return user32.FindWindowW("Button", "Start")


def hide_taskbar():
    """Hide the Windows taskbar."""
    hwnd = get_taskbar_handle()
    if hwnd:
        user32.ShowWindow(hwnd, SW_HIDE)
    # Also hide the Start button overlay (Windows 10/11)
    start_hwnd = user32.FindWindowW("Windows.UI.Core.CoreWindow", None)
    if start_hwnd:
        user32.ShowWindow(start_hwnd, SW_HIDE)


def show_taskbar():
    """Show the Windows taskbar."""
    hwnd = get_taskbar_handle()
    if hwnd:
        user32.ShowWindow(hwnd, SW_SHOW)


def is_click_on_taskbar(x, y):
    """Check if the mouse click is on the taskbar area."""
    taskbar = get_taskbar_handle()
    if not taskbar:
        return False
    rect = ctypes.wintypes.RECT()
    user32.GetWindowRect(taskbar, ctypes.byref(rect))
    return rect.left <= x <= rect.right and rect.top <= y <= rect.bottom


def keyboard_hook_proc(nCode, wParam, lParam):
    """Low-level keyboard hook to block Windows key and combos."""
    global win_key_pressed

    if nCode >= 0 and kiosk_running:
        kb = ctypes.cast(lParam, ctypes.POINTER(KBDLLHOOKSTRUCT)).contents
        vk = kb.vkCode

        # Block Win key press/release
        if vk in BLOCKED_KEYS:
            if wParam in (WM_KEYDOWN, WM_SYSKEYDOWN):
                win_key_pressed = True
            elif wParam in (WM_KEYUP, WM_SYSKEYUP):
                win_key_pressed = False
            return 1  # Block the key

        # Block Win+D, Win+E, Win+R, Win+L, Win+Tab, Ctrl+Esc
        if win_key_pressed and vk in (VK_D, VK_E, VK_R, VK_L, VK_TAB):
            return 1  # Block

        # Block Ctrl+Esc (alternative Start menu)
        if vk == VK_ESCAPE:
            ctrl_pressed = user32.GetAsyncKeyState(0x11) & 0x8000
            if ctrl_pressed:
                return 1  # Block Ctrl+Esc

    return user32.CallNextHookEx(keyboard_hook, nCode, wParam, lParam)


def mouse_hook_proc(nCode, wParam, lParam):
    """Low-level mouse hook to block clicks on Start button / taskbar."""
    if nCode >= 0 and kiosk_running:
        if wParam in (WM_LBUTTONDOWN, WM_RBUTTONDOWN):
            ms = ctypes.cast(lParam, ctypes.POINTER(MSLLHOOKSTRUCT)).contents
            x, y = ms.pt.x, ms.pt.y
            if is_click_on_taskbar(x, y):
                return 1  # Block the click

    return user32.CallNextHookEx(mouse_hook, nCode, wParam, lParam)


# Keep references so they don't get garbage collected
keyboard_hook_callback = HOOKPROC(keyboard_hook_proc)
mouse_hook_callback = HOOKPROC(mouse_hook_proc)


def install_hooks():
    """Install keyboard and mouse hooks."""
    global keyboard_hook, mouse_hook

    keyboard_hook = user32.SetWindowsHookExW(
        WH_KEYBOARD_LL,
        keyboard_hook_callback,
        kernel32.GetModuleHandleW(None),
        0
    )

    mouse_hook = user32.SetWindowsHookExW(
        WH_MOUSE_LL,
        mouse_hook_callback,
        kernel32.GetModuleHandleW(None),
        0
    )

    if not keyboard_hook:
        print("❌ Failed to install keyboard hook")
    else:
        print("✅ Keyboard hook installed - Windows key BLOCKED")

    if not mouse_hook:
        print("❌ Failed to install mouse hook")
    else:
        print("✅ Mouse hook installed - Start button clicks BLOCKED")


def uninstall_hooks():
    """Remove all hooks."""
    global keyboard_hook, mouse_hook
    if keyboard_hook:
        user32.UnhookWindowsHookEx(keyboard_hook)
        keyboard_hook = None
        print("✅ Keyboard hook removed")
    if mouse_hook:
        user32.UnhookWindowsHookEx(mouse_hook)
        mouse_hook = None
        print("✅ Mouse hook removed")


def monitor_kiosk_process():
    """Monitor if kiosk is still running; cleanup when it stops."""
    global kiosk_running
    while kiosk_running:
        time.sleep(2)
        # Check if any kiosk-related python process is running
        # You can customize this check
        try:
            result = subprocess.run(
                ['tasklist', '/FI', 'IMAGENAME eq pythonw.exe', '/FO', 'CSV'],
                capture_output=True, text=True, timeout=5
            )
            # If kiosk uses a specific window title, check for it
            kiosk_hwnd = user32.FindWindowW(None, "Lab Monitoring System - Kiosk Mode")
            if not kiosk_hwnd:
                kiosk_hwnd = user32.FindWindowW(None, "Kiosk Login")
            # Keep running as long as script is active
        except Exception:
            pass

    # Cleanup
    cleanup()


def cleanup():
    """Restore everything to normal."""
    global kiosk_running
    kiosk_running = False
    uninstall_hooks()
    restore_windows_key_registry()  # Restore Windows key functionality
    show_taskbar()
    print("\n✅ All restrictions removed. System back to normal.")


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully."""
    print("\n\n⚠️  Ctrl+C detected - Cleaning up...")
    cleanup()
    sys.exit(0)


def start_blocker():
    """Main entry point to start the kiosk key blocker."""
    global kiosk_running

    print("╔════════════════════════════════════════════════════════════════╗")
    print("║         KIOSK KEY BLOCKER - ACTIVE                            ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    print("🔒 Blocking: Windows key, Start button, Ctrl+Esc")
    print("🔒 Blocking: Win+D, Win+E, Win+R, Win+L, Win+Tab")
    print("🔒 Hiding: Taskbar") 
    print("WARNING: Run as Administrator for strongest Windows key blocking!")
    print("Press Ctrl+C to stop and restore normal function.")
    print()

    signal.signal(signal.SIGINT, signal_handler)

    # Apply OS-level Windows key blocking (requires admin)
    print("[1/3] Applying OS-level Windows key block...")
    disable_windows_key_registry()
    print()

    # Hide taskbar
    print("[2/3] Hiding taskbar...")
    hide_taskbar()
    print("✅ Taskbar hidden")
    print()

    # Install hooks
    print("[3/3] Installing keyboard/mouse hooks...")
    # Install hooks
    install_hooks()

    # Message loop (required for hooks to work)
    msg = ctypes.wintypes.MSG()
    try:
        while kiosk_running:
            result = user32.GetMessageW(ctypes.byref(msg), None, 0, 0)
            if result == 0 or result == -1:
                break
            user32.TranslateMessage(ctypes.byref(msg))
            user32.DispatchMessageW(ctypes.byref(msg))
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()


def stop_blocker():
    """Stop the blocker (call from kiosk app when exiting)."""
    global kiosk_running
    kiosk_running = False
    # Post quit message to break the message loop
    user32.PostQuitMessage(0)


# ============================================================
# Can be imported or run standalone
# ============================================================
if __name__ == "__main__":
    start_blocker()