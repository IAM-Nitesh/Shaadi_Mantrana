#!/usr/bin/env node

/**
 * Shaadi Mantra - Email Invitation Sender Script
 * 
 * This script sends welcome emails to all approved users.
 * Usage: node scripts/send-invitations.js <ADMIN_KEY>
 * 
 * Example: node scripts/send-invitations.js your-admin-key-here
 */

const readline = require('readline');
const https = require('https');
const http = require('http');

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL 
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/send-invitations/`
  : 'http://localhost:3000/api/send-invitations/';

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(response.error || `HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

async function sendInvitations(adminKey) {
  try {
    console.log('🚀 Starting invitation process...');
    console.log(`📡 API Endpoint: ${API_ENDPOINT}`);
    
    const data = await makeRequest(API_ENDPOINT, { adminKey });
    
    console.log('\n📊 INVITATION RESULTS:');
    console.log('='.repeat(50));
    console.log(`📧 Total Emails: ${data.summary.total}`);
    console.log(`✅ Successfully Sent: ${data.summary.sent}`);
    console.log(`❌ Failed: ${data.summary.failed}`);
    
    if (data.results && data.results.length > 0) {
      console.log('\n📋 Detailed Results:');
      console.log('-'.repeat(50));
      
      data.results.forEach((result, index) => {
        const status = result.status === 'sent' ? '✅' : '❌';
        console.log(`${index + 1}. ${status} ${result.email}`);
        if (result.error) {
          console.log(`   ⚠️  Error: ${result.error}`);
        }
      });
    }
    
    console.log('\n🎉 Invitation process completed successfully!');
    
  } catch (error) {
    console.error('❌ Error sending invitations:', error.message);
    process.exit(1);
  }
}

async function promptForAdminKey() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('🔐 Enter admin key: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('📧 Shaadi Mantra - Email Invitation Sender');
  console.log('==========================================\n');

  // Check if we're in development mode
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
    console.log('⚠️  Development Mode Detected');
    console.log('Make sure your Next.js server is running on http://localhost:3000\n');
  }

  let adminKey = process.argv[2];

  if (!adminKey) {
    console.log('No admin key provided as argument.');
    adminKey = await promptForAdminKey();
  }

  if (!adminKey || adminKey.length < 8) {
    console.error('❌ Invalid admin key. Must be at least 8 characters long.');
    process.exit(1);
  }

  console.log('🔍 Validating admin key...');
  console.log('📤 Preparing to send invitations...\n');

  await sendInvitations(adminKey);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Process interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Process terminated');
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
