' ========================================
' LAUNCH KIOSK - NO CMD WINDOW
' ========================================
' Simple launcher that works every time
' Double-click this file to start kiosk

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Get the folder where this VBS file is located
strScriptPath = FSO.GetParentFolderName(WScript.ScriptFullName)

' Change to kiosk directory and run npm start
' Window style 0 = hidden, False = don't wait
WshShell.Run "cmd /c cd /d """ & strScriptPath & """ && npm start", 0, False

' Exit immediately - kiosk is now running in background
WScript.Quit
