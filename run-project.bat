@echo off
echo ========================================
echo RTK Project - One-Click Startup
echo ========================================
echo.

REM Kill any existing processes
echo [1/4] Cleaning up existing processes...
taskkill /f /im node.exe /t >nul 2>&1
taskkill /f /im java.exe /t >nul 2>&1
timeout /t 2 /nobreak >nul
echo     ✓ Processes cleaned up
echo.

REM Start Firebase emulator in background
echo [2/4] Starting Firebase Functions Emulator...
start /B cmd /C "firebase emulators:start --only functions --project e-store-3b608 > firebase.log 2>&1 && echo Firebase emulator started successfully >> firebase.log"
timeout /t 3 /nobreak >nul
echo     ✓ Firebase emulator starting in background
echo.

REM Wait for emulator to initialize
echo [3/4] Waiting for Firebase emulator to be ready...
timeout /t 8 /nobreak >nul

REM Check if emulator is running
netstat -ano | findstr :5001 >nul 2>&1
if %errorlevel% neq 0 (
    echo     ⚠️  Warning: Emulator might not be ready yet, but continuing...
) else (
    echo     ✓ Firebase emulator is running on port 5001
)
echo.

REM Start the development server
echo [4/4] Starting Vite development server...
echo     (Frontend will be available at http://localhost:5174/)
echo.
echo ========================================
echo  RTK Project is starting up!
echo ========================================
echo.
echo  Instructions:
echo    • Frontend: http://localhost:5174/ (opens when ready)
echo    • Firebase logs: Check firebase.log for emulator status
echo    • Press Ctrl+C to stop both services
echo.
echo ========================================

npm run dev