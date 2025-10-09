#!/usr/bin/env node

/**
 * Simple CLI tool to view and monitor mobile logs
 * This is useful for developers to quickly check logs during testing
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const readline = require('readline');

// ANSI color codes for formatting output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// Load environment variables from .env.local
function loadEnvVars() {
  try {
    const envPath = path.resolve(__dirname, '../frontend/.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !match[0].startsWith('#')) {
        const key = match[1];
        let value = match[2] || '';
        if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
          value = value.substring(1, value.length - 1);
        }
        envVars[key] = value;
      }
    });
    
    return envVars;
  } catch (err) {
    console.error(`${colors.red}Error loading .env.local:${colors.reset}`, err.message);
    return {};
  }
}

// Mock simple server to simulate receiving logs
function startMockServer(port = 3100) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/loki/api/v1/push' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        
        req.on('end', () => {
          try {
            const logs = JSON.parse(body);
            console.log(`${colors.green}✓ Received logs:${colors.reset}`);
            
            logs.streams.forEach(stream => {
              // Print stream labels
              console.log(`${colors.cyan}▶ Stream:${colors.reset}`, formatLabels(stream.stream));
              
              // Print each log entry
              stream.values.forEach(([timestamp, messageJson]) => {
                try {
                  const message = JSON.parse(messageJson);
                  const date = new Date(parseInt(timestamp) / 1000000);
                  printLogMessage(message, date, stream.stream.level);
                } catch (err) {
                  console.log(`${colors.yellow}Raw message:${colors.reset} ${messageJson}`);
                }
              });
              console.log(''); // Add spacing between streams
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            console.error(`${colors.red}Error parsing logs:${colors.reset}`, err.message);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid log format' }));
          }
        });
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    
    server.on('error', reject);
    
    server.listen(port, () => {
      console.log(`${colors.green}✓ Mock Loki server running on port ${port}${colors.reset}`);
      console.log(`${colors.yellow}ℹ Waiting for logs...${colors.reset}`);
      console.log(`${colors.dim}(Press Ctrl+C to exit)${colors.reset}`);
      console.log('');
      resolve(server);
    });
  });
}

// Format labels for display
function formatLabels(labels) {
  return Object.entries(labels)
    .map(([key, value]) => `${colors.dim}${key}=${colors.cyan}${value}${colors.reset}`)
    .join(', ');
}

// Print a formatted log message
function printLogMessage(message, timestamp, level) {
  // Format timestamp
  const timeStr = timestamp.toISOString();
  
  // Choose color based on level
  let levelColor = colors.white;
  switch (level) {
    case 'error': levelColor = colors.red; break;
    case 'warn': levelColor = colors.yellow; break;
    case 'info': levelColor = colors.green; break;
    case 'debug': levelColor = colors.blue; break;
  }
  
  // Format the main log message
  console.log(`${colors.dim}${timeStr}${colors.reset} ${levelColor}[${level.toUpperCase()}]${colors.reset} ${colors.bright}${message.message || ''}${colors.reset}`);
  
  // Format additional data
  if (message.device) {
    console.log(`  ${colors.dim}Device: ${message.device.platform || 'unknown'} ${message.device.model || ''} (${message.device.osVersion || ''})${colors.reset}`);
  }
  
  // Print other data fields
  const skipFields = ['message', 'device'];
  Object.entries(message)
    .filter(([key]) => !skipFields.includes(key))
    .forEach(([key, value]) => {
      console.log(`  ${colors.dim}${key}:${colors.reset}`, typeof value === 'object' ? JSON.stringify(value) : value);
    });
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.magenta}Mobile Logs Monitor${colors.reset}`);
  console.log(`${colors.dim}===========================${colors.reset}`);
  
  // Load environment variables
  const env = loadEnvVars();
  
  // Start mock server
  try {
    const server = await startMockServer(3100);
    
    // Setup clean shutdown
    process.on('SIGINT', () => {
      console.log(`\n${colors.yellow}Shutting down server...${colors.reset}`);
      server.close(() => {
        console.log(`${colors.green}Server stopped.${colors.reset}`);
        process.exit(0);
      });
    });
  } catch (err) {
    console.error(`${colors.red}Failed to start server:${colors.reset}`, err.message);
    process.exit(1);
  }
}

// Run the script
main().catch(err => {
  console.error(`${colors.red}Error:${colors.reset}`, err);
  process.exit(1);
});