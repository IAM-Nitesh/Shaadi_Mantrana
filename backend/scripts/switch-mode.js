#!/usr/bin/env node

/**
 * Mode Switcher for ShaadiMantra Backend
 * Easily switch between static/mock data and MongoDB modes
 */

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '../.env.development');

function updateEnvFile(dataSource) {
  if (!fs.existsSync(envFile)) {
    console.error('❌ .env.development file not found!');
    process.exit(1);
  }

  let content = fs.readFileSync(envFile, 'utf8');
  
  // Update DATA_SOURCE
  content = content.replace(/^DATA_SOURCE=.*/m, `DATA_SOURCE=${dataSource}`);
  
  // Comment/uncomment MONGODB_URI based on mode
  if (dataSource === 'static') {
    content = content.replace(/^MONGODB_URI=/m, '# MONGODB_URI=');
    content = content.replace(/^DATABASE_NAME=/m, '# DATABASE_NAME=');
  } else if (dataSource === 'mongodb') {
    content = content.replace(/^# MONGODB_URI=/m, 'MONGODB_URI=');
    content = content.replace(/^# DATABASE_NAME=/m, 'DATABASE_NAME=');
  }
  
  fs.writeFileSync(envFile, content);
}

function showCurrentMode() {
  if (!fs.existsSync(envFile)) {
    console.error('❌ .env.development file not found!');
    return;
  }

  const content = fs.readFileSync(envFile, 'utf8');
  const dataSourceMatch = content.match(/^DATA_SOURCE=(.*)$/m);
  
  if (dataSourceMatch) {
    const currentMode = dataSourceMatch[1];
    console.log(`📊 Current mode: ${currentMode.toUpperCase()}`);
    
    if (currentMode === 'static') {
      console.log('🔧 Using static/mock controllers on port 4500');
      console.log('📦 No database connection required');
    } else if (currentMode === 'mongodb') {
      console.log('🔧 Using MongoDB controllers on port 5500');
      console.log('📦 MongoDB connection required');
    }
  } else {
    console.log('❓ Mode not detected, defaulting to static');
  }
}

function showHelp() {
  console.log(`
🔄 ShaadiMantra Backend Mode Switcher

Usage: node scripts/switch-mode.js [mode]

Modes:
  static   - Use static/mock data controllers (port 4500)
  mongodb  - Use MongoDB controllers (port 5500)
  status   - Show current mode
  help     - Show this help message

Examples:
  node scripts/switch-mode.js static
  node scripts/switch-mode.js mongodb
  node scripts/switch-mode.js status

Available npm scripts:
  npm run dev:static   - Start in static mode
  npm run dev:mongodb  - Start in MongoDB mode
  npm run prod:static  - Production static mode
  npm run prod:mongodb - Production MongoDB mode
`);
}

const mode = process.argv[2];

switch (mode) {
  case 'static':
    updateEnvFile('static');
    console.log('✅ Switched to STATIC mode');
    console.log('🔧 Using static/mock controllers on port 4500');
    console.log('📦 No database connection required');
    console.log('\n🚀 Start server: npm run dev:static');
    break;
    
  case 'mongodb':
    updateEnvFile('mongodb');
    console.log('✅ Switched to MONGODB mode');
    console.log('🔧 Using MongoDB controllers on port 5500');
    console.log('📦 MongoDB connection required');
    console.log('\n🚀 Start server: npm run dev:mongodb');
    break;
    
  case 'status':
    showCurrentMode();
    break;
    
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  default:
    console.log('❓ Invalid or missing mode argument');
    showHelp();
    process.exit(1);
}
