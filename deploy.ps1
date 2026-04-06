# Firebase Deployment Script for RTK Rental System (PowerShell)
Write-Host "🚀 Starting Firebase Deployment for RTK Rental System..." -ForegroundColor Green

# Check if Firebase CLI is installed
$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
    Write-Host "❌ Firebase CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
Write-Host "🔐 Checking Firebase login status..." -ForegroundColor Cyan
firebase login --no-localhost

# Deploy Firestore rules only (separate from indexes to avoid conflicts)
Write-Host "📋 Deploying Firestore security rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules

# Deploy Firestore indexes
Write-Host "📊 Deploying Firestore indexes..." -ForegroundColor Cyan
firebase deploy --only firestore:indexes

# Build the application
Write-Host "🔨 Building React application..." -ForegroundColor Cyan
npm run build

# Deploy to Firebase Hosting (optional)
$deployHosting = Read-Host "Do you want to deploy to Firebase Hosting? (y/n)"
if ($deployHosting -eq "y" -or $deployHosting -eq "Y") {
    Write-Host "🌐 Deploying to Firebase Hosting..." -ForegroundColor Cyan
    firebase deploy --only hosting
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🎉 Your RTK Rental System security rules are now active!" -ForegroundColor Green
