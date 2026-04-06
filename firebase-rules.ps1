# Firebase Rules Management Script
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod")]
    [string]$Mode
)

Write-Host "🔥 Firebase Rules Management Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

$projectPath = Get-Location

if ($Mode -eq "dev") {
    Write-Host "🔧 Switching to DEVELOPMENT rules..." -ForegroundColor Yellow
    Write-Host "⚠️  WARNING: These rules are permissive and NOT secure for production!" -ForegroundColor Red
    
    # Copy dev rules to main rules file
    Copy-Item "$projectPath\firestore.dev.rules" "$projectPath\firestore.rules" -Force
    Write-Host "✅ Development rules copied to firestore.rules" -ForegroundColor Green
    
} elseif ($Mode -eq "prod") {
    Write-Host "🔒 Switching to PRODUCTION rules..." -ForegroundColor Green
    Write-Host "🛡️  These rules provide proper security for production use" -ForegroundColor Green
    
    # Check if production rules exist
    if (-not (Test-Path "$projectPath\firestore.prod.rules")) {
        Write-Host "❌ Production rules file not found!" -ForegroundColor Red
        Write-Host "Creating production rules template..." -ForegroundColor Yellow
        
        # Create production rules template
        @"
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             request.auth.uid in ['REPLACE_WITH_YOUR_ADMIN_UID']; // TODO: Add your admin UIDs
    }
    
    function isOwnerOrAdmin(userId) {
      return isOwner(userId) || isAdmin();
    }

    match /users/{userId} {
      allow read: if isOwnerOrAdmin(userId);
      allow write: if isOwner(userId);
    }

    match /products/{productId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /rental_bookings/{bookingId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() && 
                       request.auth.uid == resource.data.userId;
      allow update: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    match /rental_notifications/{notificationId} {
      allow read: if isAuthenticated() && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && 
                       (resource.data.userId == request.auth.uid || isAdmin());
    }

    match /users/{userId}/cart/{cartId} {
      allow read, write: if isOwner(userId);
    }
    
    match /users/{userId}/cart_items/{itemId} {
      allow read, write: if isOwner(userId);
    }

    match /users/{userId}/wishlist/{wishlistId} {
      allow read, write: if isOwner(userId);
    }
    
    match /users/{userId}/wishlist_items/{itemId} {
      allow read, write: if isOwner(userId);
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
"@ | Out-File "$projectPath\firestore.prod.rules" -Encoding UTF8
        
        Write-Host "📝 Production rules template created: firestore.prod.rules" -ForegroundColor Green
        Write-Host "🔧 Please edit the admin UIDs in the production rules before deployment!" -ForegroundColor Yellow
        return
    }
    
    # Copy production rules to main rules file
    Copy-Item "$projectPath\firestore.prod.rules" "$projectPath\firestore.rules" -Force
    Write-Host "✅ Production rules copied to firestore.rules" -ForegroundColor Green
}

# Ask if user wants to deploy immediately
$deploy = Read-Host "Do you want to deploy these rules to Firebase now? (y/n)"
if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "🚀 Deploying rules to Firebase..." -ForegroundColor Cyan
    firebase deploy --only firestore:rules
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Rules deployed successfully!" -ForegroundColor Green
        Write-Host "🎉 Your Firebase rules are now active in $Mode mode" -ForegroundColor Green
    } else {
        Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
    }
} else {
    Write-Host "📋 Rules updated locally but not deployed." -ForegroundColor Yellow
    Write-Host "Run 'firebase deploy --only firestore:rules' when ready to deploy." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Current Status:" -ForegroundColor Cyan
Write-Host "  Mode: $Mode" -ForegroundColor White
Write-Host "  Rules file: firestore.rules" -ForegroundColor White
Write-Host "  Deployed: $(if ($deploy -eq 'y') { 'Yes' } else { 'No' })" -ForegroundColor White
