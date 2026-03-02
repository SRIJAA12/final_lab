' ================================================================
' SILENT KIOSK LAUNCHER - NO CMD WINDOW
' ================================================================
' This launches the kiosk without showing any CMD window
' The kiosk will have FULL control over keyboard shortcuts
' ================================================================

Set WshShell = CreateObject("WScript.Shell")

' Get the script's directory
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Navigate to kiosk directory and run npm start
' 0 = Hidden window (no CMD visible)
' False = Don't wait for completion
WshShell.Run "cmd /c cd /d C:\StudentKiosk && npm start", 0, False

' Alternative: If kiosk is in a different location, change path above
' Example: WshShell.Run "cmd /c cd /d D:\MyKiosk && npm start", 0, False

Set WshShell = Nothing

' ================================================================
' HOW TO USE:
' 1. Copy this file to C:\StudentKiosk\LAUNCH_KIOSK_HIDDEN.vbs
' 2. Double-click this VBS file to start kiosk
' 3. NO CMD WINDOW will appear
' 4. Kiosk will have full keyboard control
' ================================================================
