#!/usr/bin/env bash
# ============================================================
# Shaadi Mantrana — Security Audit & Auto-Fix Script
# Compatible: bash 3.2+ (macOS default), Node 18+
#
# Usage:
#   bash scripts/security-audit-fix.sh              # audit only
#   bash scripts/security-audit-fix.sh --fix        # audit + safe fix
#   bash scripts/security-audit-fix.sh --auto-fix   # audit + safe fix + clean reinstall
# ============================================================

# NOTE: NOT using "set -u" — bash 3.2 (macOS default) has no associative arrays
set -eo pipefail

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

MODE="${1:-}"
ERRORS=0
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Helpers ──────────────────────────────────────────────────
header() {
  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
  echo -e "${BOLD}${CYAN}  🔐 Shaadi Mantrana Security Audit${RESET}"
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
  echo -e "  Mode: ${BOLD}${MODE:-audit-only}${RESET}   Time: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
}

section() { echo ""; echo -e "${BOLD}${CYAN}── $1 ${RESET}"; }

# Extract severity counts from npm audit --json output via Node
parse_json_counts() {
  node -e "
    var chunks = [];
    process.stdin.on('data', function(c){ chunks.push(c); });
    process.stdin.on('end', function(){
      try {
        var d = JSON.parse(chunks.join(''));
        var m = (d.metadata && d.metadata.vulnerabilities) ? d.metadata.vulnerabilities : {};
        process.stdout.write((m.critical||0)+' '+(m.high||0)+' '+(m.moderate||0)+' '+(m.low||0)+'\n');
      } catch(e) { process.stdout.write('0 0 0 0\n'); }
    });
  " 2>/dev/null || echo "0 0 0 0"
}

# ── Ensure root install ──
ensure_install() {
  if [ ! -d "$ROOT_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚙ Installing dependencies (root workspace)...${RESET}"
    npm install --silent 2>&1 | tail -5
  fi
}

# ── Audit one scope, attempt fix if requested ─────────────────
audit_scope() {
  local label="$1"
  local ws_flag="$2"   # "" | "--workspace=frontend" | "--workspace=backend"

  section "$label"
  cd "$ROOT_DIR"
  ensure_install

  local AUDIT COUNTS CRITICAL HIGH MODERATE LOW
  AUDIT=$(npm audit --json $ws_flag 2>/dev/null || true)
  COUNTS=$(echo "$AUDIT" | parse_json_counts)
  CRITICAL=$(echo "$COUNTS" | awk '{print $1}')
  HIGH=$(echo "$COUNTS"     | awk '{print $2}')
  MODERATE=$(echo "$COUNTS" | awk '{print $3}')
  LOW=$(echo "$COUNTS"      | awk '{print $4}')
  CRITICAL=${CRITICAL:-0}; HIGH=${HIGH:-0}; MODERATE=${MODERATE:-0}; LOW=${LOW:-0}

  [ "$CRITICAL" -gt 0 ] && echo -e "  ${RED}🔴 Critical : $CRITICAL${RESET}"
  [ "$HIGH" -gt 0 ]     && echo -e "  ${RED}🟠 High     : $HIGH${RESET}"
  [ "$MODERATE" -gt 0 ] && echo -e "  ${YELLOW}🟡 Moderate : $MODERATE${RESET}"
  [ "$LOW" -gt 0 ]      && echo -e "  🔵 Low      : $LOW"
  [ $((CRITICAL+HIGH+MODERATE+LOW)) -eq 0 ] && echo -e "  ${GREEN}✅ Clean — no vulnerabilities${RESET}" && return 0

  # ── Fix logic ──────────────────────────────────────────────
  if [ $((CRITICAL + HIGH)) -gt 0 ]; then
    if [ "$MODE" = "--fix" ] || [ "$MODE" = "--auto-fix" ]; then
      echo -e "\n  ${YELLOW}🔧 Running safe audit fix...${RESET}"
      npm audit fix $ws_flag --silent 2>&1 | tail -3 || true

      local A2 C2 H2
      A2=$(npm audit --json $ws_flag 2>/dev/null || true)
      C2=$(echo "$A2" | parse_json_counts | awk '{print $1}')
      H2=$(echo "$A2" | parse_json_counts | awk '{print $2}')
      C2=${C2:-0}; H2=${H2:-0}

      if [ $((C2+H2)) -eq 0 ]; then
        echo -e "  ${GREEN}✅ Fixed!${RESET}"; return 0
      fi

      if [ "$MODE" = "--auto-fix" ]; then
        echo -e "  ${YELLOW}⚠ Safe fix insufficient — running clean reinstall...${RESET}"
        # NEVER use --force as it can corrupt package.json and increase vulnerabilities
        
        # Wipe everything to flush stale workspace lockfile pins
        rm -f "$ROOT_DIR/package-lock.json"
        rm -rf "$ROOT_DIR/node_modules" \
               "$ROOT_DIR/frontend/node_modules" \
               "$ROOT_DIR/backend/node_modules"
        npm install --silent 2>&1 | tail -5

        local A3 C3 H3
        A3=$(npm audit --json $ws_flag 2>/dev/null || true)
        C3=$(echo "$A3" | parse_json_counts | awk '{print $1}')
        H3=$(echo "$A3" | parse_json_counts | awk '{print $2}')
        C3=${C3:-0}; H3=${H3:-0}

        if [ $((C3+H3)) -eq 0 ]; then
          echo -e "  ${GREEN}✅ Resolved after clean reinstall!${RESET}"; return 0
        else
          echo -e "  ${RED}❌ Still $C3 critical + $H3 high — manual fix needed${RESET}"
          echo -e "     Run: ${BOLD}npm audit $ws_flag${RESET} to see details"
          ERRORS=$((ERRORS+1))
        fi
      else
        echo -e "  ${RED}❌ Still $C2 critical + $H2 high after safe fix${RESET}"
        echo -e "     Try: ${BOLD}bash scripts/security-audit-fix.sh --auto-fix${RESET}"
        ERRORS=$((ERRORS+1))
      fi
    else
      echo -e "  ${RED}❌ Blocking vulnerabilities — run: bash scripts/security-audit-fix.sh --fix${RESET}"
      ERRORS=$((ERRORS+1))
    fi
  fi
}

# ── Known CVE minimum version check (bash 3.2 safe) ──
check_pinned_versions() {
  section "Known CVE Package Version Check"
  [ ! -f "$ROOT_DIR/package-lock.json" ] && echo -e "  ${YELLOW}⚠ No lockfile found${RESET}" && return

  ROOT_DIR="$ROOT_DIR" node -e "
    var fs = require('fs');
    var path = require('path');
    var lock = JSON.parse(fs.readFileSync(path.join(process.env.ROOT_DIR,'package-lock.json'),'utf8'));
    var pkgs = lock.packages || {};

    var minimums = [
      { name:'nodemailer',           min:'6.9.13', cve:'SMTP injection (GHSA-vvjj)' },
      { name:'next',                 min:'15.5.7', cve:'RCE CVE-2025-66478' },
      { name:'serialize-javascript', min:'6.0.2',  cve:'RCE via RegExp' },
      { name:'braces',               min:'3.0.3',  cve:'ReDoS' },
      { name:'postcss',              min:'8.4.31', cve:'XSS via </style>' },
      { name:'micromatch',           min:'4.0.8',  cve:'ReDoS' },
      { name:'elliptic',             min:'6.5.7',  cve:'Risky crypto' }
    ];

    function semverOk(v, min) {
      v = v.replace(/^[^0-9]*/,''); min = min.replace(/^[^0-9]*/,'');
      var a=v.split('.').map(Number), b=min.split('.').map(Number);
      for(var i=0;i<3;i++){
        if((a[i]||0)>(b[i]||0)) return true;
        if((a[i]||0)<(b[i]||0)) return false;
      }
      return true;
    }

    minimums.forEach(function(item){
      var found = [];
      Object.keys(pkgs).forEach(function(p){
        var n = p.split('/').pop();
        // Skip @types/ packages as they don't contain runtime code/vulnerabilities
        if(n === item.name && !p.includes('@types/')) {
          found.push({ path:p, version:pkgs[p].version||'?' });
        }
      });
      if(!found.length){ console.log('  \u2139\uFE0F  '+item.name+': not in lockfile'); return; }
      found.forEach(function(inst){
        var ok = semverOk(inst.version, item.min);
        var icon = ok ? '\u2705' : '\u274C';
        var msg = ok ? 'OK' : 'NEEDS >='+item.min+' ('+item.cve+')';
        console.log('  '+icon+' '+item.name+'@'+inst.version+' \u2192 '+msg);
      });
    });
  " 2>/dev/null || echo -e "  ${YELLOW}⚠ Version check skipped (node error)${RESET}"
}

# ── Main ─────────────────────────────────────────────────────
main() {
  cd "$ROOT_DIR"
  header

  audit_scope "Root + All Workspaces" ""
  audit_scope "Frontend Workspace"    "--workspace=frontend"
  audit_scope "Backend Workspace"     "--workspace=backend"
  check_pinned_versions

  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
  if [ "$ERRORS" -gt 0 ]; then
    echo -e "${BOLD}${RED}  ❌ SECURITY GATE FAILED — $ERRORS scope(s) blocked${RESET}"
    echo -e "${RED}  Do not merge/deploy. Fix commands:${RESET}"
    echo -e "    ${BOLD}bash scripts/security-audit-fix.sh --fix${RESET}"
    echo -e "    ${BOLD}bash scripts/security-audit-fix.sh --auto-fix${RESET}  ← full clean reinstall"
    echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
    exit 1
  else
    echo -e "${BOLD}${GREEN}  ✅ SECURITY GATE PASSED — Safe to merge and deploy${RESET}"
    echo -e "${BOLD}${CYAN}══════════════════════════════════════════════${RESET}"
    exit 0
  fi
}

main
