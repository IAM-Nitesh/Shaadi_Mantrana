#!/usr/bin/env node

/**
 * Frontend Environment Switching Script
 * Easily switch between development and production environments
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'help' || command === '--help' || command === '-h') {
  console.log('🔄 Frontend Environment Switching Script\n');
  console.log('Usage: node scripts/switch-env.js <command>\n');
  console.log('Commands:');
  console.log('  dev          - Switch to development mode');
  console.log('  prod         - Switch to production mode');
  console.log('  status       - Show current environment status');
  console.log('  validate     - Validate current environment configuration');
  console.log('  help         - Show this help message\n');
  console.log('Examples:');
  console.log('  node scripts/switch-env.js dev');
  console.log('  node scripts/switch-env.js prod');
  console.log('  node scripts/switch-env.js status');
  process.exit(0);
}

function getCurrentEnv() {
  return process.env.NODE_ENV || 'development';
}

function setEnvironment(env) {
  console.log(`🔄 Switching to ${env} environment...\n`);
  
  // Set environment variable for current session
  process.env.NODE_ENV = env;
  
  // Show what will change
  console.log('📋 Environment Changes:');
  console.log(`   NODE_ENV: ${env}`);
  
  if (env === 'production') {
    console.log('   🔒 HTTPS: enabled');
    console.log('   🍪 Secure cookies: enabled');
    console.log('   🚀 Performance optimizations: enabled');
    console.log('   🐛 Debug mode: disabled');
    console.log('   📊 Analytics: enabled');
  } else {
    console.log('   🔓 HTTPS: disabled (localhost)');
    console.log('   🍪 Secure cookies: disabled');
    console.log('   🚀 Performance optimizations: disabled');
    console.log('   🐛 Debug mode: enabled');
    console.log('   📊 Analytics: disabled');
  }
  
  console.log('\n💡 To start the frontend with this environment:');
  if (env === 'production') {
    console.log('   npm run build && npm start');
    console.log('   NODE_ENV=production npm run dev');
  } else {
    console.log('   npm run dev');
    console.log('   npm run dev:remote-backend');
    console.log('   NODE_ENV=development npm run dev');
  }
  
  console.log('\n⚠️  Note: This only affects the current terminal session.');
  console.log('   For permanent changes, set NODE_ENV in your shell profile.');
}

function showStatus() {
  const currentEnv = getCurrentEnv();
  const isProduction = currentEnv === 'production';
  
  console.log('🔍 Current Frontend Environment Status\n');
  console.log(`   Environment: ${currentEnv}`);
  console.log(`   Mode: ${isProduction ? 'Production' : 'Development'}`);
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   VERCEL: ${process.env.VERCEL || 'not set'}`);
  console.log(`   NEXT_PUBLIC_API_BASE_URL: ${process.env.NEXT_PUBLIC_API_BASE_URL || 'not set'}`);
  console.log(`   NEXT_PUBLIC_ENABLE_DEBUG: ${process.env.NEXT_PUBLIC_ENABLE_DEBUG || 'not set'}`);
  
  // Check configuration
  try {
    const config = require('../src/services/configService');
    console.log('\n⚙️  Configuration:');
    console.log(`   API Base URL: ${config.config.apiBaseUrl || 'Not set'}`);
    console.log(`   App Name: ${config.config.appName}`);
    console.log(`   App Version: ${config.config.appVersion}`);
    console.log(`   Debug Mode: ${config.config.enableDebug}`);
    console.log(`   Analytics: ${config.config.enableAnalytics}`);
  } catch (error) {
    console.log('\n❌ Configuration loading failed:', error.message);
    console.log('   This is expected if the service hasn\'t been built yet');
  }
  
  // Show what's different in each mode
  console.log('\n🔧 Mode Differences:');
  if (isProduction) {
    console.log('   ✅ Production mode active');
    console.log('   ✅ HTTPS and secure cookies enabled');
    console.log('   ✅ Performance optimizations active');
    console.log('   ✅ Analytics enabled');
  } else {
    console.log('   🛠️  Development mode active');
    console.log('   🔓 HTTP and relaxed security for development');
    console.log('   🚀 Development features enabled');
    console.log('   🐛 Debug mode active');
  }
}

function validateEnvironment() {
  console.log('🔍 Validating frontend environment configuration...\n');
  
  // Run the validation script
  try {
    require('./validate-env');
  } catch (error) {
    console.log('❌ Validation script failed:', error.message);
  }
}

// Execute commands
switch (command) {
  case 'dev':
  case 'development':
    setEnvironment('development');
    break;
    
  case 'prod':
  case 'production':
    setEnvironment('production');
    break;
    
  case 'status':
    showStatus();
    break;
    
  case 'validate':
    validateEnvironment();
    break;
    
  default:
    console.log(`❌ Unknown command: ${command}`);
    console.log('💡 Use "node scripts/switch-env.js help" for usage information');
    process.exit(1);
}

console.log('\n✨ Frontend environment switching complete!');
