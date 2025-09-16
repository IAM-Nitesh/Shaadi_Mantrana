#!/usr/bin/env node

/**
 * Email Service Timeout Test Script
 * 
 * This script tests the email service with different timeout configurations
 * to help diagnose SMTP connection issues in production.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const nodemailer = require('nodemailer');

// Test configurations with different timeout values
const testConfigs = [
  {
    name: 'Current Production (5s)',
    timeouts: {
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    }
  },
  {
    name: 'Increased Timeouts (15s)',
    timeouts: {
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000
    }
  },
  {
    name: 'Conservative Timeouts (30s)',
    timeouts: {
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    }
  }
];

async function testEmailConfig(config, timeouts) {
  console.log(`\n🔍 Testing ${config.name}...`);
  console.log(`   Connection Timeout: ${timeouts.connectionTimeout}ms`);
  console.log(`   Greeting Timeout: ${timeouts.greetingTimeout}ms`);
  console.log(`   Socket Timeout: ${timeouts.socketTimeout}ms`);

  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    ...timeouts
  });

  try {
    const startTime = Date.now();
    await transporter.verify();
    const duration = Date.now() - startTime;
    console.log(`   ✅ Connection successful (${duration}ms)`);
    return { success: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Connection failed (${duration}ms): ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

async function runTests() {
  console.log('📧 Email Service Timeout Test');
  console.log('================================');
  
  // Check environment variables
  console.log('\n📋 Environment Configuration:');
  console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || 'NOT SET'}`);
  console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || 'NOT SET'}`);
  console.log(`   SMTP_USER: ${process.env.SMTP_USER ? 'SET' : 'NOT SET'}`);
  console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? 'SET' : 'NOT SET'}`);
  console.log(`   ENABLE_EMAIL: ${process.env.ENABLE_EMAIL || 'NOT SET'}`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    return;
  }

  const results = [];

  for (const config of testConfigs) {
    const result = await testEmailConfig(config, config.timeouts);
    results.push({ ...config, ...result });
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name} (${result.duration}ms)`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  // Recommendations
  console.log('\n💡 Recommendations:');
  const successfulConfigs = results.filter(r => r.success);
  if (successfulConfigs.length > 0) {
    const fastest = successfulConfigs.reduce((prev, current) => 
      prev.duration < current.duration ? prev : current
    );
    console.log(`   • Use ${fastest.name} for optimal performance`);
    console.log(`   • Fastest successful connection: ${fastest.duration}ms`);
  } else {
    console.log('   • All configurations failed - check SMTP credentials and network connectivity');
    console.log('   • Consider using alternative email providers (Resend, SendGrid)');
  }
}

// Run the tests
runTests().catch(console.error);
