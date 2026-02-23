' ========================================
' STUDENT KIOSK - SILENT AUTO-START
' ========================================
' This script launches the kiosk WITHOUT showing any command window
' Place this file in Windows Startup folder for auto-start on login

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
    ' DEVELOPMENT MODE: Run with npm start (hidden window)
    ' 0 = Hidden window, False = Don't wait for it to finish
    WshShell.Run "cmd /c cd /d """ & strScriptPath & """ && npm start", 0, False
Else
    ' PRODUCTION MODE: Look for the EXE file
    
    ' Check multiple possible EXE locations
    Dim exePath
    exePath = ""
    
    ' Location 1: dist folder in current directory
    If CreateObject("Scripting.FileSystemObject").FileExists(strScriptPath & "\dist\student-kiosk.exe") Then
        exePath = strScriptPath & "\dist\student-kiosk.exe"
    ' Location 2: parent dist folder
    ElseIf CreateObject("Scripting.FileSystemObject").FileExists(strScriptPath & "\..\..\dist\student-kiosk.exe") Then
        exePath = strScriptPath & "\..\..\dist\student-kiosk.exe"
    ' Location 3: Standard installation path
    ElseIf CreateObject("Scripting.FileSystemObject").FileExists("C:\StudentKiosk\student-kiosk.exe") Then
        exePath = "C:\StudentKiosk\student-kiosk.exe"
    ' Location 4: Program Files
    ElseIf CreateObject("Scripting.FileSystemObject").FileExists("C:\Program Files\StudentKiosk\student-kiosk.exe") Then
        exePath = "C:\Program Files\StudentKiosk\student-kiosk.exe"
    End If
    
    If exePath <> "" Then
        ' Launch the EXE (hidden window - not applicable to EXE, but 0 prevents cmd window)
        WshShell.Run """" & exePath & """", 0, False
    Else
        ' ERROR: Show message box if kiosk not found
        MsgBox "ERROR: Student Kiosk application not found!" & vbCrLf & vbCrLf & _
               "Please ensure the kiosk is installed or run from the correct folder.", _
               vbCritical, "Kiosk Auto-Start Error"
    End If
End If

' Script ends - kiosk is now running in background
