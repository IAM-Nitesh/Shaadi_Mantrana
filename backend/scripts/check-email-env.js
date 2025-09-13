#!/usr/bin/env node

/**
 * Email Environment Check Script
 * 
 * This script checks the email environment configuration
 * and provides recommendations for fixing SMTP timeout issues.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function checkEnvironment() {
  console.log('🔍 Email Environment Check');
  console.log('==========================');
  
  const checks = [
    {
      name: 'SMTP_HOST',
      value: process.env.SMTP_HOST,
      required: true,
      recommendation: 'Set to your SMTP server (e.g., smtp.gmail.com)'
    },
    {
      name: 'SMTP_PORT',
      value: process.env.SMTP_PORT,
      required: true,
      recommendation: 'Set to 587 for TLS or 465 for SSL'
    },
    {
      name: 'SMTP_USER',
      value: process.env.SMTP_USER,
      required: true,
      recommendation: 'Set to your email address'
    },
    {
      name: 'SMTP_PASS',
      value: process.env.SMTP_PASS,
      required: true,
      recommendation: 'Set to your email password or app password'
    },
    {
      name: 'ENABLE_EMAIL',
      value: process.env.ENABLE_EMAIL,
      required: false,
      recommendation: 'Set to "true" to enable email service'
    },
    {
      name: 'EMAIL_SEND_TIMEOUT_MS',
      value: process.env.EMAIL_SEND_TIMEOUT_MS,
      required: false,
      recommendation: 'Set to 15000 or higher for production'
    },
    {
      name: 'EMAIL_CONNECT_TIMEOUT_MS',
      value: process.env.EMAIL_CONNECT_TIMEOUT_MS,
      required: false,
      recommendation: 'Set to 10000 or higher for production'
    },
    {
      name: 'RESEND_API_KEY',
      value: process.env.RESEND_API_KEY,
      required: false,
      recommendation: 'Set as fallback for SMTP issues'
    },
    {
      name: 'SENDGRID_API_KEY',
      value: process.env.SENDGRID_API_KEY,
      required: false,
      recommendation: 'Set as fallback for SMTP issues'
    }
  ];

  let allGood = true;

  checks.forEach(check => {
    const status = check.value ? '✅' : (check.required ? '❌' : '⚠️');
    const required = check.required ? 'REQUIRED' : 'OPTIONAL';
    
    console.log(`${status} ${check.name}: ${check.value || 'NOT SET'} (${required})`);
    
    if (!check.value && check.required) {
      allGood = false;
      console.log(`   💡 ${check.recommendation}`);
    } else if (!check.value && !check.required) {
      console.log(`   💡 ${check.recommendation}`);
    }
  });

  console.log('\n📊 Environment Summary:');
  if (allGood) {
    console.log('✅ All required email environment variables are set');
  } else {
    console.log('❌ Some required email environment variables are missing');
  }

  console.log('\n🔧 Recommended Environment Variables for Production:');
  console.log('ENABLE_EMAIL=true');
  console.log('SMTP_HOST=smtp.gmail.com');
  console.log('SMTP_PORT=587');
  console.log('SMTP_USER=your-email@gmail.com');
  console.log('SMTP_PASS=your-app-password');
  console.log('EMAIL_SEND_TIMEOUT_MS=15000');
  console.log('EMAIL_CONNECT_TIMEOUT_MS=10000');
  console.log('EMAIL_SOCKET_TIMEOUT_MS=15000');
  console.log('EMAIL_GREETING_TIMEOUT_MS=10000');
  
  console.log('\n🚀 Alternative Email Providers (if SMTP fails):');
  console.log('RESEND_API_KEY=your-resend-api-key');
  console.log('SENDGRID_API_KEY=your-sendgrid-api-key');
  
  console.log('\n📝 Notes:');
  console.log('• Gmail requires App Passwords for SMTP (not regular password)');
  console.log('• Some hosting providers block SMTP ports (25, 587, 465)');
  console.log('• Consider using API-based email services for better reliability');
  console.log('• The application will fallback to console logging if email fails');
}

checkEnvironment();
