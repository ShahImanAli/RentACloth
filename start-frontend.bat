@echo off
echo ========================================
echo Starting RTK Development Server
echo ========================================

echo Cleaning up any existing Node processes...
taskkill /f /im node.exe /t >nul 2>&1

echo.
echo Starting Vite development server...
echo (This will show the localhost link when ready)
echo.

npm run dev