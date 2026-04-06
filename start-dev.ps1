# RTK Project Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting RTK Project with Firebase Emulator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Kill any existing processes
Write-Host "Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Starting Firebase Functions Emulator..." -ForegroundColor Green
Write-Host "(This will show emulator logs and port information)" -ForegroundColor Gray
Write-Host ""

# Start Firebase emulator (will show output in foreground)
firebase emulators:start --only functions --project e-store-3b608