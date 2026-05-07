' ========================================
' TEST KIOSK LAUNCH - SHOWS ERRORS
' ========================================
' Use this to test if kiosk can start
' Shows CMD window to see any error messages

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Get the folder where this VBS file is located
strScriptPath = FSO.GetParentFolderName(WScript.ScriptFullName)

MsgBox "Starting kiosk from:" & vbCrLf & strScriptPath & vbCrLf & vbCrLf & _
       "CMD window will stay open to show any errors." & vbCrLf & _
       "Close CMD window when you see kiosk.", vbInformation, "Kiosk Test Launch"

' Show CMD window (1 = normal window, True = wait for it to finish)
' This lets you see if npm start works
WshShell.Run "cmd /k cd /d """ & strScriptPath & """ && npm start", 1, False

WScript.Quit
