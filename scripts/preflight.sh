#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# 🔐 SHAADI MANTRANA - PREFLIGHT VALIDATION (V4 - THE FINAL STRETCH)
# ─────────────────────────────────────────────────────────────────────────────

set -e 

# Ensure we are in the project root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 Starting Preflight Validation in $ROOT_DIR..."

# 1. CLEANUP
echo "🧹 Cleaning temporary files..."
npm run clean > /dev/null 2>&1 || true

# 2. SECURITY AUDIT
echo "🔐 Running Security Audit..."
npm run security:audit || {
  echo "❌ SECURITY GATE FAILED."
  exit 1
}

# 2.3 KNOWLEDGE DECAY AUDIT
echo "🧠 Checking Continuous Learning Expiry..."
node scripts/audit-knowledge-decay.js --strict || {
  echo "❌ KNOWLEDGE DECAY AUDIT FAILED."
  exit 1
}


# 2.5 WORKSPACE ISOLATION CHECK
echo "🏢 Checking Workspace Isolation (Vercel Compatibility)..."
bash scripts/audit-workspace-deps.sh frontend || exit 1
bash scripts/audit-workspace-deps.sh backend || exit 1

# 3. INSTALLATION SYNC
echo "📦 Verifying dependency synchronization..."
npm install --legacy-peer-deps --package-lock-only

# 4. TYPE CHECKING
echo "⌨️ Running Type Checks (Frontend)..."
if [ -d "frontend" ]; then
  (cd frontend && npx -y -p typescript tsc --noEmit)
else
  echo "⚠️ Frontend directory not found, skipping."
fi

# 5. BUILD VALIDATION
echo "🏗️ Testing Production Build (Frontend)..."
if [ -d "frontend" ]; then
  (cd frontend && npm run build)
fi

# 6. CAPACITOR SYNC
echo "📱 Validating Capacitor Sync..."
if [ -f "capacitor.config.ts" ] || [ -f "capacitor.config.json" ]; then
  # Use the full package name to avoid path issues
  npx -y @capacitor/cli sync || {
    echo "❌ CAPACITOR SYNC FAILED."
    exit 1
  }
else
  if [ -d "frontend" ] && ([ -f "frontend/capacitor.config.ts" ] || [ -f "frontend/capacitor.config.json" ]); then
    (cd frontend && npx -y @capacitor/cli sync)
  else
    echo "⚠️ Capacitor not configured, skipping."
  fi
fi

echo "─────────────────────────────────────────────────────────────────────────────"
echo "✅ PREFLIGHT PASSED! Your branch is safe to push."
echo "─────────────────────────────────────────────────────────────────────────────"
