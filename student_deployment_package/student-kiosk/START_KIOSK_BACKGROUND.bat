@echo off
REM ==================================================================
REM Student Kiosk - Background Launcher (NO CMD WINDOW)
REM ==================================================================
REM This batch file launches the kiosk in the background using VBScript
REM to ensure NO CMD window is visible at all.
REM ==================================================================

REM Launch using VBScript for completely hidden execution
start /min "" wscript.exe "C:\StudentKiosk\START_KIOSK_SILENT.vbs"

REM Exit immediately
exit
