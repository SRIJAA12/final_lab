' ========================================
' STUDENT KIOSK - SILENT AUTO-START WITH ADMIN RIGHTS
' ========================================
' This script launches the kiosk WITHOUT showing any command window
' AND requests administrator privileges for shutdown functionality
' Place this file in Windows Startup folder for auto-start on login

' Check if running as administrator
If Not WScript.Arguments.Named.Exists("elevated") Then
  ' If not elevated, restart with elevated privileges
  CreateObject("Shell.Application").ShellExecute "wscript.exe", Chr(34) & WScript.ScriptFullName & Chr(34) & " /elevated", "", "runas", 0
  WScript.Quit
End If

' Now running as administrator - proceed with kiosk launch
Set WshShell = CreateObject("WScript.Shell")

' Get the folder where this VBS file is located
strScriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Change to the kiosk directory
WshShell.CurrentDirectory = strScriptPath

' Check if npm is available (development mode)
On Error Resume Next
WshShell.Run "cmd /c where npm > nul 2>&1", 0, True
npmExists = (Err.Number = 0)
On Error GoTo 0

If npmExists Then
    ' DEVELOPMENT MODE: Run with npm start (hidden window, elevated)
    WshShell.Run "cmd /c cd /d """ & strScriptPath & """ && npm start", 0, False
Else
    ' PRODUCTION MODE: Look for the EXE file
    Dim exePath
    exePath = ""
    
    ' Check multiple possible EXE locations
    If CreateObject("Scripting.FileSystemObject").FileExists(strScriptPath & "\dist\student-kiosk.exe") Then
        exePath = strScriptPath & "\dist\student-kiosk.exe"
    ElseIf CreateObject("Scripting.FileSystemObject").FileExists(strScriptPath & "\..\..\dist\student-kiosk.exe") Then
        exePath = strScriptPath & "\..\..\dist\student-kiosk.exe"
    ElseIf CreateObject("Scripting.FileSystemObject").FileExists("C:\StudentKiosk\student-kiosk.exe") Then
        exePath = "C:\StudentKiosk\student-kiosk.exe"
    ElseIf CreateObject("Scripting.FileSystemObject").FileExists("C:\Program Files\StudentKiosk\student-kiosk.exe") Then
        exePath = "C:\Program Files\StudentKiosk\student-kiosk.exe"
    End If
    
    If exePath <> "" Then
        ' Launch the EXE with admin rights (already elevated)
        WshShell.Run """" & exePath & """", 0, False
    Else
        ' ERROR: Show message box if kiosk not found
        MsgBox "ERROR: Student Kiosk application not found!" & vbCrLf & vbCrLf & _
               "Please ensure the kiosk is installed or run from the correct folder.", _
               vbCritical, "Kiosk Auto-Start Error"
    End If
End If

' Script ends - kiosk is now running in background with admin rights
