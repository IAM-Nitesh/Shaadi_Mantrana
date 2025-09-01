#!/bin/bash

# Render Keep-Alive Script
# Pings the production server every minute to prevent sleep

URL="https://shaadi-mantrana.onrender.com/health"
INTERVAL=60  # seconds

echo "🚀 Starting Render Keep-Alive Service"
echo "📍 Target URL: $URL"
echo "⏰ Ping Interval: $INTERVAL seconds"
echo "========================================"

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Make the request and capture response
    RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code};TIME:%{time_total}" "$URL")

    # Extract HTTP status and response time
    HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://' | sed -e 's/;TIME.*//')
    RESPONSE_TIME=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*TIME://')

    # Check if request was successful
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ [$TIMESTAMP] Server is awake (HTTP $HTTP_STATUS, ${RESPONSE_TIME}s)"
    else
        echo "❌ [$TIMESTAMP] Server ping failed (HTTP $HTTP_STATUS, ${RESPONSE_TIME}s)"
    fi

    # Wait for next ping
    sleep $INTERVAL
done
