#!/bin/bash

# 🧠 SHAADI MANTRANA - Branding Asset Generator
# Purpose: Maintain a Single Source of Truth for visual branding.
# Generates all required Android and Web assets from a single source.

SOURCE="branding/final_icon.png"
RES_DIR="android/app/src/main/res"
PUBLIC_DIR="frontend/public"

if [ ! -f "$SOURCE" ]; then
    echo "❌ Error: Source file $SOURCE not found!"
    exit 1
fi

echo "🚀 Starting Branding Asset Generation..."

# --- ANDROID ASSETS ---
echo "📱 Generating Android Mipmaps & Drawables..."
update_android() {
    local size=$1
    local folder=$2
    sips -z $size $size "$SOURCE" --out "$RES_DIR/$folder/ic_launcher.png" > /dev/null
    sips -z $size $size "$SOURCE" --out "$RES_DIR/$folder/ic_launcher_round.png" > /dev/null
    sips -z $size $size "$SOURCE" --out "$RES_DIR/$folder/ic_launcher_foreground.png" > /dev/null
}

update_android 48 "mipmap-mdpi"
update_android 72 "mipmap-hdpi"
update_android 96 "mipmap-xhdpi"
update_android 144 "mipmap-xxhdpi"
update_android 192 "mipmap-xxxhdpi"

# Splash screens (generic 1024x1024 for Capacitor to scale)
for folder in $(ls -d $RES_DIR/drawable*); do
    if [ -f "$folder/splash.png" ]; then
        sips -z 1024 1024 "$SOURCE" --out "$folder/splash.png" > /dev/null
    fi
done

# --- WEB ASSETS ---
echo "🌐 Generating Web & PWA Assets..."
cp "$SOURCE" "$PUBLIC_DIR/icon.png"
cp "$SOURCE" "$PUBLIC_DIR/icon-512.png"
cp "$SOURCE" "$PUBLIC_DIR/favicon.png"
sips -z 32 32 "$SOURCE" --out "$PUBLIC_DIR/favicon-32x32.png" > /dev/null
sips -z 16 16 "$SOURCE" --out "$PUBLIC_DIR/favicon-16x16.png" > /dev/null

echo "✅ Success: 30+ assets synchronized from $SOURCE"
