#!/bin/bash

# scripts/audit-workspace-deps.sh
# Verifies that all external imports in a workspace are explicitly declared in its local package.json.

WORKSPACE=$1
if [ -z "$WORKSPACE" ]; then
  echo "❌ Error: No workspace specified (e.g., frontend, backend)"
  exit 1
fi

ROOT_DIR=$(pwd)
WS_DIR="$ROOT_DIR/$WORKSPACE"

if [ ! -d "$WS_DIR" ]; then
  echo "❌ Error: Workspace directory $WS_DIR not found"
  exit 1
fi

echo "🔍 Auditing $WORKSPACE dependencies for isolation..."

# 1. Get all unique external imports from src
# Excludes: react, next, relative imports (./, ../), and internal @/ aliases
IMPORTS=$(grep -r "from '" "$WS_DIR/src" --include="*.ts" --include="*.tsx" | awk -F"'" '{print $2}' | grep -v "^\." | grep -v "^@/" | sort | uniq)

# 2. Check each import against package.json
MISSING_DEPS=()
PK_JSON="$WS_DIR/package.json"

for DEP in $IMPORTS; do
  # Handle scoped packages (e.g., @capacitor/device -> @capacitor)
  BASE_DEP=$(echo "$DEP" | awk -F'/' '{if($1 ~ /^@/) print $1"/"$2; else print $1}')
  
  # Skip built-in Node modules
  if [[ "$BASE_DEP" =~ ^(path|fs|os|crypto|events|util|http|https|url|querystring|stream|buffer|child_process)$ ]]; then
    continue
  fi

  if ! grep -q "\"$BASE_DEP\":" "$PK_JSON"; then
    MISSING_DEPS+=("$BASE_DEP")
  fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
  echo "❌ ISOLATION FAILURE in $WORKSPACE:"
  for MISSING in "${MISSING_DEPS[@]}"; do
    echo "   - '$MISSING' is imported but not declared in $WORKSPACE/package.json"
  done
  echo "💡 Vercel will fail to build this workspace. Fix: npm install $WORKSPACE ${MISSING_DEPS[*]}"
  exit 1
fi

echo "✅ $WORKSPACE isolation verified."
exit 0
