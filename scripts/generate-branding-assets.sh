#!/bin/bash

# 🧠 SHAADI MANTRANA - Branding Asset Generator (Hardened V2)
# Purpose: Maintain a Single Source of Truth for visual branding.
# Generates all required Android and Web assets from a single source.
# Fixes: Adaptive icon safe-zone padding and proper resolution scaling.

SOURCE="branding/final_icon.png"
RES_DIR="android/app/src/main/res"
PUBLIC_DIR="frontend/public"
BG_COLOR="#121212"

if [ ! -f "$SOURCE" ]; then
    echo "❌ Error: Source file $SOURCE not found!"
    exit 1
fi

echo "🚀 Starting Hardened Branding Asset Generation..."

# --- PREPARE PADDED FOREGROUND ---
# Android Adaptive Icons need the logo to be in a "safe zone" (inner 66%).
# We pad the 512x512 source to ~800x800 to create that padding.
echo "🎨 Preparing padded foreground for Adaptive Icons..."
TEMP_FOREGROUND="branding/temp_foreground.png"
sips --padToHeightWidth 850 850 --padColor 121212 "$SOURCE" --out "$TEMP_FOREGROUND" > /dev/null

# --- ANDROID ASSETS ---
echo "📱 Generating Android Mipmaps & Drawables..."
update_android() {
    local legacy_size=$1
    local adaptive_size=$2
    local folder=$3
    
    # Legacy Launcher Icons (Square)
    sips -z $legacy_size $legacy_size "$SOURCE" --out "$RES_DIR/$folder/ic_launcher.png" > /dev/null
    sips -z $legacy_size $legacy_size "$SOURCE" --out "$RES_DIR/$folder/ic_launcher_round.png" > /dev/null
    
    # Adaptive Foreground (Padded)
    sips -z $adaptive_size $adaptive_size "$TEMP_FOREGROUND" --out "$RES_DIR/$folder/ic_launcher_foreground.png" > /dev/null
}

# Sizes: Legacy (48dp base), Adaptive (108dp base)
update_android 48  108 "mipmap-mdpi"
update_android 72  162 "mipmap-hdpi"
update_android 96  216 "mipmap-xhdpi"
update_android 144 324 "mipmap-xxhdpi"
update_android 192 432 "mipmap-xxxhdpi"

# --- SPLASH SCREENS ---
# Splash screens should be large squares to allow for CENTER_CROP without stretching.
echo "✨ Updating Splash Screens..."
SPLASH_SOURCE="branding/temp_splash.png"
# Pad to 2732x2732 (iPad Pro resolution) to ensure it's high-res enough for any phone
sips --padToHeightWidth 2048 2048 --padColor 121212 "$SOURCE" --out "$SPLASH_SOURCE" > /dev/null

for folder in $(ls -d $RES_DIR/drawable*); do
    if [ -f "$folder/splash.png" ]; then
        sips -z 2048 2048 "$SPLASH_SOURCE" --out "$folder/splash.png" > /dev/null
    fi
done

# --- WEB ASSETS ---
echo "🌐 Generating Web & PWA Assets..."
cp "$SOURCE" "$PUBLIC_DIR/icon.png"
cp "$SOURCE" "$PUBLIC_DIR/icon-512.png"
cp "$SOURCE" "$PUBLIC_DIR/favicon.png"
sips -z 32 32 "$SOURCE" --out "$PUBLIC_DIR/favicon-32x32.png" > /dev/null
sips -z 16 16 "$SOURCE" --out "$PUBLIC_DIR/favicon-16x16.png" > /dev/null

# Cleanup
rm "$TEMP_FOREGROUND"
rm "$SPLASH_SOURCE"

echo "✅ Success: All assets synchronized and padded for Adaptive Icons."
