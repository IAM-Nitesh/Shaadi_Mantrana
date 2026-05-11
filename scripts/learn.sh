#!/bin/bash

# 🧠 SHAADI MANTRANA - CONTINUOUS LEARNING UTILITY (v2)
# Usage: ./scripts/learn.sh "Title" "Insight" "Domain" "Expiry Hint"
# Domain examples: System | Pipeline | Backend | UI | Mobile | Security
# Expiry Hint: "Permanent" | "Review after Next.js major upgrade" | etc.

set -e

LEARNING_FILE="ai-agents/knowledge-base/continuous-learning.md"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

if [ "$#" -lt 1 ]; then
    echo "Usage: ./scripts/learn.sh \"Title\" \"Insight\" \"Domain\" \"Expiry Hint\""
    exit 1
fi

TITLE=$1
INSIGHT=${2:-"(no insight provided)"}
DOMAIN=${3:-"General"}
EXPIRY=$4

# Guard: expiry hint is required and must not be a placeholder
if [ -z "$EXPIRY" ] || [ "$EXPIRY" = "TODO" ] || [ "$EXPIRY" = "todo" ]; then
    echo "❌ ERROR: Expiry hint (argument 4) is required and cannot be empty or 'TODO'."
    echo "   Example: ./scripts/learn.sh \"Title\" \"Insight\" \"Pipeline\" \"Review after Next.js major upgrade\""
    echo "   Use \"Permanent\" if the learning truly has no expiry."
    exit 1
fi

cat <<EOF >> "$LEARNING_FILE"

---

### 🎓 Learning: $TITLE
**Date**: $DATE
**Version**: 1.0 | **Domain**: $DOMAIN | **Expiry Hint**: $EXPIRY
**Insight**:
$INSIGHT

EOF

echo "✅ Knowledge Base updated: $TITLE [Domain: $DOMAIN]"
