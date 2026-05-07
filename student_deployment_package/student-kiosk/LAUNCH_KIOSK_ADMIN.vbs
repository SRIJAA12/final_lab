' ========================================
' LAUNCH KIOSK WITH ADMIN - NO CMD WINDOW
' ========================================
' Requests admin rights, then launches kiosk
' Right-click → Run as administrator

' Check if running as administrator
If Not WScript.Arguments.Named.Exists("elevated") Then
  ' If not elevated, restart with admin privileges
  CreateObject("Shell.Application").ShellExecute "wscript.exe", _
    Chr(34) & WScript.ScriptFullName & Chr(34) & " /elevated", "", "runas", 0
  WScript.Quit
End If

' Now running as admin
Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Get the folder where this VBS file is located
strScriptPath = FSO.GetParentFolderName(WScript.ScriptFullName)

' Launch kiosk with npm start (hidden window)
WshShell.Run "cmd /c cd /d """ & strScriptPath & """ && npm start", 0, False

' Exit - kiosk is now running with admin rights
WScript.Quit
