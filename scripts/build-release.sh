#!/bin/bash

# Exit script if any command fails
set -e

echo "🚀 Starting Shaadi Mantrana Production Build..."

echo "📦 1/3: Building Next.js Frontend..."
cd frontend
npm run build
cd ..

echo "🔄 2/3: Syncing web assets to Android using Capacitor..."
npx cap sync android

echo "🔐 3/3: Building signed release AAB..."
cd android
./gradlew bundleRelease
cd ..

echo "✅ Build Complete!"
echo "📍 Your release AAB is ready at:"
echo "   android/app/build/outputs/bundle/release/app-release.aab"
