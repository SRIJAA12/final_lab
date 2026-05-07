' ==================================================================
' Student Kiosk - Silent Launcher (COMPLETELY HIDDEN - NO WINDOWS)
' ==================================================================
' This VBScript launches the kiosk application with ZERO visibility:
' - No CMD window at any point
' - No console output
' - Completely silent background process
' ==================================================================

Set WshShell = CreateObject("WScript.Shell")

' Change to kiosk directory
kioskPath = "C:\StudentKiosk"

' 🔒 SECURITY: Launch completely hidden using cmd /c with full output suppression
' The key is to cd to the directory first, then run npm start
command = "cmd /c ""cd /d """ & kioskPath & """ && npm start > nul 2>&1"""

' Run command with windowStyle = 0 (COMPLETELY HIDDEN)
' Parameters: command, windowStyle, waitOnReturn
' windowStyle: 0 = Hidden window (NO WINDOW AT ALL)
' waitOnReturn: False = Don't wait, exit immediately
WshShell.Run command, 0, False

' Clean up
Set WshShell = Nothing
