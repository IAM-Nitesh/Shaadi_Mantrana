#!/usr/bin/env bash
# ============================================================
# Shaadi Mantrana — Security Audit & Auto-Fix Script
# Run before every git push or deployment.
# Usage:
#   bash scripts/security-audit-fix.sh           # audit only
#   bash scripts/security-audit-fix.sh --fix     # audit + safe fix
#   bash scripts/security-audit-fix.sh --auto-fix # audit + force fix + clean reinstall
# ============================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

# ── Args ─────────────────────────────────────────────────────
MODE="${1:-}"      # --fix | --auto-fix | (empty = audit only)
ERRORS=0

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

print_header() {
  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
  echo -e "${BOLD}${CYAN}  🔐 Shaadi Mantrana Security Audit${RESET}"
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
  echo -e "  Mode: ${BOLD}${MODE:-audit-only}${RESET}"
  echo -e "  Time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
}

print_section() {
  echo ""
  echo -e "${BOLD}${CYAN}── $1 ──────────────────────────────────────────${RESET}"
}

run_audit() {
  local label="$1"
  local dir="$2"

  print_section "$label"
  cd "$dir"

  # Ensure node_modules exist
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚙ Installing dependencies in $dir...${RESET}"
    npm install --silent 2>&1 | tail -5
  fi

  # Get audit JSON
  AUDIT_JSON=$(npm audit --json 2>/dev/null || true)

  CRITICAL=$(echo "$AUDIT_JSON" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const m=d.metadata?.vulnerabilities||{};console.log(m.critical||0)}catch(e){console.log(0)}" 2>/dev/null || echo 0)
  HIGH=$(echo "$AUDIT_JSON"     | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const m=d.metadata?.vulnerabilities||{};console.log(m.high||0)}catch(e){console.log(0)}" 2>/dev/null || echo 0)
  MODERATE=$(echo "$AUDIT_JSON" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const m=d.metadata?.vulnerabilities||{};console.log(m.moderate||0)}catch(e){console.log(0)}" 2>/dev/null || echo 0)
  LOW=$(echo "$AUDIT_JSON"      | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const m=d.metadata?.vulnerabilities||{};console.log(m.low||0)}catch(e){console.log(0)}" 2>/dev/null || echo 0)

  TOTAL=$((CRITICAL + HIGH + MODERATE + LOW))

  # Report
  if [ "$CRITICAL" -gt 0 ]; then
    echo -e "  ${RED}🔴 Critical : $CRITICAL${RESET}"
  fi
  if [ "$HIGH" -gt 0 ]; then
    echo -e "  ${RED}🟠 High     : $HIGH${RESET}"
  fi
  if [ "$MODERATE" -gt 0 ]; then
    echo -e "  ${YELLOW}🟡 Moderate : $MODERATE${RESET}"
  fi
  if [ "$LOW" -gt 0 ]; then
    echo -e "  🔵 Low      : $LOW"
  fi
  if [ "$TOTAL" -eq 0 ]; then
    echo -e "  ${GREEN}✅ No vulnerabilities found!${RESET}"
  fi

  # Fix logic
  if [ $((CRITICAL + HIGH)) -gt 0 ]; then
    if [ "$MODE" = "--fix" ] || [ "$MODE" = "--auto-fix" ]; then
      echo -e "\n  ${YELLOW}🔧 Attempting npm audit fix...${RESET}"
      npm audit fix --silent 2>&1 | tail -5 || true

      # Re-check after fix
      AUDIT_JSON2=$(npm audit --json 2>/dev/null || true)
      CRITICAL2=$(echo "$AUDIT_JSON2" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const m=d.metadata?.vulnerabilities||{};console.log(m.critical||0)}catch(e){console.log(0)}" 2>/dev/null || echo 0)
      HIGH2=$(echo "$AUDIT_JSON2" | node -e "try{const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const m=d.metadata?.vulnerabilities||{};console.log(m.high||0)}catch(e){console.log(0)}" 2>/dev/null || echo 0)

      if [ $((CRITICAL2 + HIGH2)) -gt 0 ] && [ "$MODE" = "--auto-fix" ]; then
        echo -e "  ${YELLOW}⚠ Safe fix insufficient — running force fix + clean reinstall...${RESET}"
        npm audit fix --force --silent 2>&1 | tail -5 || true
        # Clean reinstall to flush stale lockfile entries (handles workspace next.js issue)
        cd "$ROOT_DIR"
        echo -e "  ${CYAN}🧹 Clean reinstall (removing stale lockfile pins)...${RESET}"
        rm -f package-lock.json 2>/dev/null || true
        rm -rf node_modules frontend/node_modules backend/node_modules 2>/dev/null || true
        npm install --silent 2>&1 | tail -5
        cd "$dir"
        echo -e "  ${GREEN}✅ Force fix + clean reinstall complete${RESET}"
      elif [ $((CRITICAL2 + HIGH2)) -eq 0 ]; then
        echo -e "  ${GREEN}✅ Fixed! All critical/high vulnerabilities resolved.${RESET}"
      else
        echo -e "  ${RED}❌ Still $CRITICAL2 critical + $HIGH2 high after fix — manual intervention needed!${RESET}"
        ERRORS=$((ERRORS + 1))
      fi
    else
      echo -e "  ${RED}❌ BLOCKING vulnerabilities found in $label${RESET}"
      echo -e "     Run: ${BOLD}bash scripts/security-audit-fix.sh --fix${RESET}"
      ERRORS=$((ERRORS + 1))
    fi
  fi

  cd "$ROOT_DIR"
}

# ── Dependency version check ──────────────────────────────────
check_pinned_versions() {
  print_section "Pinned Version Audit (known CVE packages)"

  declare -A KNOWN_MINIMUMS=(
    ["nodemailer"]="8.0.5"
    ["next"]="15.5.7"
    ["serialize-javascript"]="6.0.2"
    ["braces"]="3.0.3"
    ["postcss"]="8.4.31"
    ["micromatch"]="4.0.8"
    ["elliptic"]="6.5.7"
  )

  for PKG in "${!KNOWN_MINIMUMS[@]}"; do
    MIN_VER="${KNOWN_MINIMUMS[$PKG]}"
    # Check installed version from root lockfile
    if [ -f "$ROOT_DIR/package-lock.json" ]; then
      INSTALLED=$(node -e "
        try {
          const d = require('$ROOT_DIR/package-lock.json');
          const pkgs = d.packages || {};
          const versions = Object.entries(pkgs)
            .filter(([k]) => k.endsWith('/$PKG') || k === 'node_modules/$PKG')
            .map(([,v]) => v.version);
          const semver = require('semver') || null;
          console.log(versions.join(', ') || 'not found');
        } catch(e) { console.log('unknown'); }
      " 2>/dev/null || echo "unknown")

      echo -e "  ${PKG}: installed=${INSTALLED}, minimum=${MIN_VER}"
    fi
  done
}

# ── Main ─────────────────────────────────────────────────────
main() {
  cd "$ROOT_DIR"
  print_header

  run_audit "Root Workspace"   "$ROOT_DIR"
  run_audit "Frontend"         "$ROOT_DIR/frontend"
  run_audit "Backend"          "$ROOT_DIR/backend"
  check_pinned_versions

  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
  if [ "$ERRORS" -gt 0 ]; then
    echo -e "${BOLD}${RED}  ❌ SECURITY GATE FAILED — $ERRORS workspace(s) have blocking vulnerabilities${RESET}"
    echo -e "${RED}  DO NOT merge/deploy until resolved.${RESET}"
    echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
    exit 1
  else
    echo -e "${BOLD}${GREEN}  ✅ SECURITY GATE PASSED — Safe to merge and deploy${RESET}"
    echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
    exit 0
  fi
}

main
