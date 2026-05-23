#!/usr/bin/env bash

# 🧠 SHAADI MANTRANA - CONTEXT INFILTRATION UTILITY
# Usage: ./scripts/get-context.sh <domain>
# Examples: ./scripts/get-context.sh backend
#           ./scripts/get-context.sh frontend
#           ./scripts/get-context.sh mobile

set -e

DOMAIN=$(echo "$1" | tr '[:upper:]' '[:lower:]')

if [ -z "$DOMAIN" ]; then
  echo "❌ Error: Please specify a domain (e.g., backend, frontend, mobile, qa, ci-engineer, architect)"
  echo "Available personas:"
  ls -1 ai-agents/personas/ | sed 's/\.md//'
  exit 1
fi

PERSONA_FILE="ai-agents/personas/${DOMAIN}.md"

# Fallback check for alternate name mapping (e.g. qa -> qa.md, ci -> ci-engineer.md)
if [ ! -f "$PERSONA_FILE" ]; then
  if [ "$DOMAIN" = "ci" ]; then
    PERSONA_FILE="ai-agents/personas/ci-engineer.md"
  elif [ "$DOMAIN" = "ui" ] || [ "$DOMAIN" = "ux" ]; then
    PERSONA_FILE="ai-agents/personas/premium-ui.md"
  fi
fi

if [ ! -f "$PERSONA_FILE" ]; then
  echo "❌ Error: Persona file for domain '${DOMAIN}' not found at ${PERSONA_FILE}"
  exit 1
fi

echo "# 🧠 CONSOLIDATED AGENT CONTEXT: $(echo "$DOMAIN" | tr '[:lower:]' '[:upper:]')"
echo ""
echo "---"
echo ""
echo "## 👤 MAPPED PERSONA"
echo ""
cat "$PERSONA_FILE"
echo ""
echo "---"
echo ""

echo "## 🚧 ACTIVE WORK IN PROGRESS (All Domains)"
echo "> Check if any interface you plan to touch is already in flight."
echo ""
sed -n '/## Active WIP/,/## Recently Stabilized/p' ai-agents/WIP_MANIFEST.md | grep -v '## Recently Stabilized'
echo ""
echo "---"
echo ""

echo "## 📋 ACTIVE ASSUMPTIONS"
echo "> Review active assumptions matching this domain to prevent regression."
echo ""
# Extract active assumptions and filter for matching domain blocks
sed -n '/## Active Assumptions/,$p' ai-agents/ASSUMPTIONS.md | awk -v pat="$DOMAIN" '
  BEGIN { print_block = 1; }
  /^###/ { 
    lower_line = tolower($0);
    if (index(lower_line, pat) > 0 || index(lower_line, "system") > 0 || index(lower_line, "testing") > 0) {
      print_block = 1;
    } else {
      print_block = 0;
    }
  }
  { if (print_block) print $0; }
'
echo ""
echo "---"
echo ""

echo "## 🔁 RECENT FEEDBACK FINDINGS"
echo "> Ingest recent human findings in this domain to prevent repeating mistakes."
echo ""
# Extract active findings matching domain
sed -n '/## Active Findings/,/## Resolved/p' ai-agents/knowledge-base/feedback.md | grep -v '## Resolved' | awk -v pat="$DOMAIN" '
  BEGIN { print_block = 1; }
  /^###/ { 
    lower_line = tolower($0);
    if (index(lower_line, pat) > 0 || index(lower_line, "system") > 0 || index(lower_line, "qa") > 0) {
      print_block = 1;
    } else {
      print_block = 0;
    }
  }
  { if (print_block) print $0; }
'
echo ""
