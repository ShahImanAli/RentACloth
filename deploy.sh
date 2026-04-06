#!/bin/bash

# Firebase Deployment Script for RTK Rental System
echo "🚀 Starting Firebase Deployment for RTK Rental System..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
echo "🔐 Checking Firebase login status..."
firebase login:ci

# Deploy Firestore rules
echo "📋 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

# Deploy Firestore indexes
echo "📊 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

# Build the application
echo "🔨 Building React application..."
npm run build

# Deploy to Firebase Hosting
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Deployment completed successfully!"
echo "🎉 Your RTK Rental System is now live!"

# Open the deployed application
echo "🌟 Opening your live application..."
firebase open hosting:site
