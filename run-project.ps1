# RTK Project - One-Click Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RTK Project - One-Click Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing processes
Write-Host "[1/4] Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "    ✓ Processes cleaned up" -ForegroundColor Green
Write-Host ""

# Start Firebase emulator in background
Write-Host "[2/4] Starting Firebase Functions Emulator..." -ForegroundColor Yellow
$firebaseJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\shahi\Desktop\RTK-Project"
    firebase emulators:start --only functions --project e-store-3b608 > firebase.log 2>&1
}
Start-Sleep -Seconds 3
Write-Host "    ✓ Firebase emulator starting in background" -ForegroundColor Green
Write-Host ""

# Wait for emulator to initialize
Write-Host "[3/4] Waiting for Firebase emulator to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Check if emulator is running
$portCheck = netstat -ano | Select-String ":5001"
if ($portCheck) {
    Write-Host "    ✓ Firebase emulator is running on port 5001" -ForegroundColor Green
} else {
    Write-Host "    ⚠️  Warning: Emulator might not be ready yet, but continuing..." -ForegroundColor Yellow
}
Write-Host ""

# Start the development server
Write-Host "[4/4] Starting Vite development server..." -ForegroundColor Yellow
Write-Host "    (Frontend will be available at http://localhost:5174/)" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 RTK Project is starting up!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor White
Write-Host "   • Frontend: http://localhost:5174/ (opens when ready)" -ForegroundColor White
Write-Host "   • Firebase logs: Check firebase.log for emulator status" -ForegroundColor White
Write-Host "   • Press Ctrl+C to stop both services" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "C:\Users\shahi\Desktop\RTK-Project"
npm run dev

# Clean up background job when done
Stop-Job $firebaseJob -ErrorAction SilentlyContinue
Remove-Job $firebaseJob -ErrorAction SilentlyContinue