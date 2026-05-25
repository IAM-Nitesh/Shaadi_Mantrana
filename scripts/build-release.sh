#!/bin/bash
# =============================================================
#  Shaadi Mantrana — Local Release Build Script
#  Run this to build a signed AAB ready for Play Store upload.
# =============================================================

set -e  # Exit on any error

echo ""
echo "🚀 Shaadi Mantrana — Release Build"
echo "==================================="
echo ""

# ── Check we're in the project root ──────────────────────────
if [ ! -f "capacitor.config.json" ]; then
  echo "❌ Run this script from the project root directory."
  exit 1
fi

# ── Check keystore exists ─────────────────────────────────────
if [ ! -f "android/shaadi-mantrana-release.jks" ]; then
  echo "❌ Keystore not found at android/shaadi-mantrana-release.jks"
  echo "   Run: keytool -genkey -v -keystore android/shaadi-mantrana-release.jks -alias shaadi-mantrana -keyalg RSA -keysize 2048 -validity 10000"
  exit 1
fi

if [ ! -f "android/keystore.properties" ]; then
  echo "❌ android/keystore.properties not found. Copy from template and fill in passwords."
  exit 1
fi

# ── Step 1: Build frontend ────────────────────────────────────
echo "📦 Step 1/4 — Building Next.js frontend..."
(cd frontend && npm run build)
echo "✅ Frontend built"
echo ""

# ── Step 2: Sync Capacitor ────────────────────────────────────
echo "🔄 Step 2/4 — Syncing Capacitor web assets..."
npx cap sync android
echo "✅ Capacitor synced"
echo ""

# ── Step 3: Build signed AAB ──────────────────────────────────
echo "🔨 Step 3/4 — Building signed release AAB..."
(cd android && ./gradlew bundleRelease --quiet)
echo "✅ AAB built"
echo ""

# ── Step 4: Done ──────────────────────────────────────────────
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"
AAB_SIZE=$(du -sh "$AAB_PATH" | cut -f1)

echo "🎉 Step 4/4 — Build complete!"
echo ""
echo "   📁 File : $AAB_PATH"
echo "   📏 Size : $AAB_SIZE"
echo ""
echo "   Upload to Play Store:"
echo "   https://play.google.com/console"
echo ""
