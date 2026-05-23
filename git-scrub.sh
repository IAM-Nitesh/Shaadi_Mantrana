#!/bin/bash
# 🛑 Git History Secret Scrubbing Script 🛑
# Run this script to scrub the specific leaked credentials from your entire git history.
# Uses `git-filter-repo` (already installed globally via npm or available via brew/pip).

echo "Creating replacements file..."

cat << 'EOF' > replacements.txt
mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net==>mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net
mongodb+srv://shaadimantrauser:J5ehVPHj04cCY4HS@cluster-m0freetier.5xmurlk.mongodb.net==>mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster-m0freetier.5xmurlk.mongodb.net
xgemnazzfyyuxzvr==><REDACTED_SMTP_PASS>
glsa_d6rMGJGgjSbaGgztdQVxTnv6wa44FatN_185afbbd==><REDACTED_GRAFANA_PASSWORD>
glc_eyJvIjoiMTQ4ODc3OSIsIm4iOiJzdGFjay0xMzU2NTkwLWhsLXdyaXRlLXJlbmRlcl9sb2tpX2FwaV9rZXkiLCJrIjoiTnJCMHhtMzV0NEFTYnQ3M3IzMjl2bEw2IiwibSI6eyJyIjoicHJvZC1hcC1zb3V0aC0xIn19==><REDACTED_GRAFANA_PASSWORD>
glc_eyJvIjoiMTQ4ODc3OSIsIm4iOiJkZXYtc2hhYWRpbWFudHJhLXBvc3QtMi1kZXYtc2hhYWRpbWFudHJhLXBvc3QtMiIsImsiOiJQQjAySTZUMDlwRVRUMUk5MGw3RlBBRDYiLCJtIjp7InIiOiJ1cyJ9fQ====><REDACTED_GRAFANA_PASSWORD>
AIzaSyBOfBRskwJo0-UekM_GG_488Jf2Nqu2sWc==><REDACTED_FIREBASE_API_KEY>
https://hooks.slack.com/services/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==><REDACTED_SLACK_WEBHOOK>
EOF

echo "Running git-filter-repo to scrub secrets..."
# Note: --force is required because git-filter-repo refuses to run if it thinks the working directory isn't fresh
git-filter-repo --replace-text replacements.txt --force

echo "Scrubbing complete."
echo "CRITICAL: You must force push these changes to your remote repository to clear the alerts."
echo "Run: git push --force --all"
echo "Note: Anyone else working on this repository will need to clone a fresh copy."

# Clean up
rm replacements.txt
