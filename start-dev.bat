@echo off
echo ========================================
echo Starting RTK Project with Firebase Emulator
echo ========================================

REM Kill any existing processes
echo Cleaning up existing processes...
taskkill /f /im node.exe /t >nul 2>&1
taskkill /f /im java.exe /t >nul 2>&1

echo.
echo Starting Firebase Functions Emulator...
echo (This will show emulator logs and port information)
echo.

REM Start Firebase emulator (will show output)
firebase emulators:start --only functions --project e-store-3b608