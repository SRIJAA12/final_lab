' ==================================================================
' Student Kiosk - Startup Launcher
' ==================================================================
' Place this file in: shell:startup
' It will launch the kiosk silently after Windows login
' ==================================================================

Set WshShell = CreateObject("WScript.Shell")

' Wait 5 seconds for Windows to fully load (network, PATH, etc.)
WScript.Sleep 5000

' Launch kiosk - use full path to npm to avoid PATH issues
kioskPath = "C:\StudentKiosk"

' Method 1: Try using npm directly
command = "cmd /c ""cd /d " & kioskPath & " && npm start"""

' Run hidden (windowStyle = 0), don't wait
WshShell.Run command, 0, False

Set WshShell = Nothing
