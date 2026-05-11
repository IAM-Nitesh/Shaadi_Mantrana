#!/usr/bin/env bash
# ============================================================
# Installs git hooks for Shaadi Mantrana security checks.
# Run once after cloning: bash scripts/install-git-hooks.sh
# ============================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_SRC="$ROOT_DIR/scripts/git-hooks"
HOOKS_DEST="$ROOT_DIR/.git/hooks"

echo "🔗 Installing Shaadi Mantrana git hooks..."

# Install pre-push hook
if [ -f "$HOOKS_SRC/pre-push" ]; then
  cp "$HOOKS_SRC/pre-push" "$HOOKS_DEST/pre-push"
  chmod +x "$HOOKS_DEST/pre-push"
  echo "  ✅ pre-push hook installed"
fi

# Make security script executable
chmod +x "$ROOT_DIR/scripts/security-audit-fix.sh"
echo "  ✅ security-audit-fix.sh is executable"

echo ""
echo "✅ Git hooks installed successfully!"
echo ""
echo "Hooks active:"
echo "  🔐 pre-push  → runs security audit before every push"
echo ""
echo "Manual audit command:"
echo "  bash scripts/security-audit-fix.sh           # audit only"
echo "  bash scripts/security-audit-fix.sh --fix     # audit + auto fix"
echo "  bash scripts/security-audit-fix.sh --auto-fix # audit + force fix + clean reinstall"
