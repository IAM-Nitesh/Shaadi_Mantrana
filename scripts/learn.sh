#!/bin/bash

# 🧠 SHAADI MANTRANA - CONTINUOUS LEARNING UTILITY
# Usage: ./scripts/learn.sh "Title" "Detailed Insight/Fix"

set -e

LEARNING_FILE="ai-agents/knowledge-base/continuous-learning.md"
DATE=$(date +"%Y-%m-%d %H:%M:%S")

if [ "$#" -lt 1 ]; then
    echo "Usage: ./scripts/learn.sh \"Title\" \"Detailed Insight/Fix\""
    exit 1
fi

TITLE=$1
INSIGHT=$2

cat <<EOF >> "$LEARNING_FILE"

---

### 🎓 Learning: $TITLE
**Date**: $DATE
**Insight**: 
$INSIGHT

EOF

echo "✅ Knowledge Base updated: $TITLE"
