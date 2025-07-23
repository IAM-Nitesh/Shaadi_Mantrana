#!/usr/bin/env node

// Port Configuration Management for ShaadiMantra
// Ensures proper port separation between dev and prod environments

const fs = require('fs');
const path = require('path');

const PORT_CONFIG = {
  development: {
    frontend: 3000,
    backend: 5500,
    mongodb: 'Atlas Cloud (27017 default for local)',
    description: 'Development environment ports'
  },
  production: {
    frontend: 3001,
    backend: 5001,
    mongodb: 'Atlas Cloud (27017 default for local)',
    description: 'Production environment ports'
  }
};

function displayPortConfiguration() {
  console.log('🌐 ShaadiMantra Port Configuration\n');
  
  Object.entries(PORT_CONFIG).forEach(([env, config]) => {
    console.log(`📋 ${env.toUpperCase()} Environment:`);
    console.log(`   Frontend:  Port ${config.frontend}`);
    console.log(`   Backend:   Port ${config.backend}`);
    console.log(`   MongoDB:   ${config.mongodb}`);
    console.log(`   ${config.description}\n`);
  });
}

function checkPortUsage() {
  const { exec } = require('child_process');
  
  console.log('🔍 Checking current port usage...\n');
  
  const portsToCheck = [3000, 3001, 5500, 5001];
  
  portsToCheck.forEach(port => {
    exec(`lsof -ti:${port}`, (error, stdout, stderr) => {
      if (stdout.trim()) {
        console.log(`⚠️  Port ${port} is currently in use (PID: ${stdout.trim()})`);
      } else {
        console.log(`✅ Port ${port} is available`);
      }
    });
  });
}

function killPortProcesses() {
  const { exec } = require('child_process');
  const portsToKill = [3000, 3001, 5500, 5001];
  
  console.log('🛑 Killing processes on configured ports...\n');
  
  portsToKill.forEach(port => {
    exec(`lsof -ti:${port} | xargs kill -9`, (error, stdout, stderr) => {
      if (!error) {
        console.log(`✅ Cleared port ${port}`);
      }
    });
  });
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'show':
    displayPortConfiguration();
    break;
  case 'check':
    displayPortConfiguration();
    checkPortUsage();
    break;
  case 'kill':
    killPortProcesses();
    setTimeout(() => {
      console.log('\n✅ Port cleanup completed');
    }, 2000);
    break;
  default:
    console.log('🌐 ShaadiMantra Port Manager\n');
    console.log('Usage:');
    console.log('  node port-config.js show   - Display port configuration');
    console.log('  node port-config.js check  - Check current port usage');
    console.log('  node port-config.js kill   - Kill processes on configured ports');
    console.log('');
    displayPortConfiguration();
}

module.exports = { PORT_CONFIG };
