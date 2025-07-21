#!/bin/bash

# Mobile Deployment Script for Shaadi Mantra
echo "🚀 Starting mobile build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Set environment for static export
export DEPLOY_TYPE=static
export NODE_ENV=production

# Build the application
echo "📦 Building application for mobile..."
npm run build:static

# Create APK-ready structure
echo "📱 Preparing mobile-ready files..."
mkdir -p mobile-build
cp -r out/* mobile-build/

# Create mobile manifest with proper settings
echo "📋 Creating mobile manifest..."
cat > mobile-build/capacitor.config.json << EOF
{
  "appId": "com.shaadimantra.app",
  "appName": "Shaadi Mantra",
  "webDir": ".",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#f472b6"
    }
  }
}
EOF

echo "✅ Mobile build complete! Files are in mobile-build/ directory"
echo "📱 Ready for Capacitor or Cordova conversion to APK"
