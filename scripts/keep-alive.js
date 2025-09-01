#!/usr/bin/env node

/**
 * Render Keep-Alive Service
 * Keeps your Render production server awake by pinging it regularly
 *
 * Usage:
 *   node scripts/keep-alive.js
 *   # or
 *   npm run keep-alive
 */

const https = require('https');
const http = require('http');

const CONFIG = {
    url: 'https://shaadi-mantrana.onrender.com/health',
    interval: 60 * 1000, // 60 seconds in milliseconds
    timeout: 10000, // 10 seconds timeout
    maxRetries: 3,
    retryDelay: 5000 // 5 seconds
};

let pingCount = 0;
let successCount = 0;
let failureCount = 0;

function formatTimestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function pingServer() {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        pingCount++;

        const url = new URL(CONFIG.url);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            timeout: CONFIG.timeout,
            headers: {
                'User-Agent': 'Render-Keep-Alive/1.0',
                'Cache-Control': 'no-cache'
            }
        };

        const req = https.request(options, (res) => {
            const responseTime = Date.now() - startTime;

            let data = '';
            res.on('data', chunk => data += chunk);

            res.on('end', () => {
                const status = res.statusCode;
                const success = status === 200;

                if (success) {
                    successCount++;
                    console.log(`✅ [${formatTimestamp()}] Ping ${pingCount} - Server awake (HTTP ${status}, ${responseTime}ms)`);
                } else {
                    failureCount++;
                    console.log(`❌ [${formatTimestamp()}] Ping ${pingCount} - Server error (HTTP ${status}, ${responseTime}ms)`);
                }

                resolve({ success, status, responseTime, data });
            });
        });

        req.on('error', (error) => {
            const responseTime = Date.now() - startTime;
            failureCount++;
            console.log(`❌ [${formatTimestamp()}] Ping ${pingCount} - Connection failed (${responseTime}ms): ${error.message}`);
            resolve({ success: false, error: error.message, responseTime });
        });

        req.on('timeout', () => {
            req.destroy();
            const responseTime = Date.now() - startTime;
            failureCount++;
            console.log(`⏰ [${formatTimestamp()}] Ping ${pingCount} - Timeout (${responseTime}ms)`);
            resolve({ success: false, error: 'timeout', responseTime });
        });

        req.end();
    });
}

async function keepAliveLoop() {
    console.log('🚀 Starting Render Keep-Alive Service');
    console.log('=====================================');
    console.log(`📍 Target URL: ${CONFIG.url}`);
    console.log(`⏰ Ping Interval: ${CONFIG.interval / 1000} seconds`);
    console.log(`⏳ Request Timeout: ${CONFIG.timeout / 1000} seconds`);
    console.log('=====================================\n');

    while (true) {
        await pingServer();

        // Print stats every 10 pings
        if (pingCount % 10 === 0) {
            const uptime = ((successCount / pingCount) * 100).toFixed(1);
            console.log(`📊 Stats: ${successCount}/${pingCount} successful (${uptime}% uptime)\n`);
        }

        await new Promise(resolve => setTimeout(resolve, CONFIG.interval));
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Render Keep-Alive Service...');
    console.log(`📊 Final Stats: ${successCount}/${pingCount} successful pings`);
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    console.log(`📊 Final Stats: ${successCount}/${pingCount} successful pings`);
    process.exit(0);
});

// Start the service
keepAliveLoop().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
