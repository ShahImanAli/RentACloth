# RTK Frontend Development Server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting RTK Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Cleaning up any existing Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Starting Vite development server..." -ForegroundColor Green
Write-Host "(This will show the localhost link when ready)" -ForegroundColor Gray
Write-Host ""

Set-Location "C:\Users\shahi\Desktop\RTK-Project"
npm run dev