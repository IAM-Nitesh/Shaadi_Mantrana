#!/bin/bash

# Setup Cron Job for Render Keep-Alive
# This script sets up a cron job to ping your Render service every minute

CRON_JOB="*/1 * * * * /bin/bash $(pwd)/scripts/keep-alive.sh"
CRON_COMMENT="# Render Keep-Alive for Shaadi Mantrana"

echo "🔧 Setting up Render Keep-Alive Cron Job"
echo "=========================================="

# Check if cron job already exists
if crontab -l | grep -q "keep-alive"; then
    echo "⚠️  Cron job already exists. Removing old one..."
    crontab -l | grep -v "keep-alive" | crontab -
fi

# Add the new cron job
(crontab -l ; echo "$CRON_COMMENT" ; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo "📋 Cron job details:"
echo "   Command: $CRON_JOB"
echo "   Schedule: Every 1 minute"
echo ""

# Verify the cron job was added
echo "📝 Current cron jobs:"
crontab -l | grep -A1 -B1 "keep-alive"

echo ""
echo "🎯 Your Render service will now be pinged every minute!"
echo "💡 To stop: Run 'crontab -e' and remove the keep-alive line"
echo "🔍 To check: Run 'crontab -l' to see all cron jobs"
