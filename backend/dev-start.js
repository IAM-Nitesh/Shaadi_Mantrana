#!/usr/bin/env node

// Development Startup Script for ShaadiMantra Backend
// Ensures proper environment loading and port management

const path = require('path');
const { exec } = require('child_process');

// Change to the backend directory
process.chdir('/Users/niteshkumar/Downloads/ShaadiMantra/backend');

console.log('🚀 ShaadiMantra Development Startup');
console.log(`📁 Working directory: ${process.cwd()}`);

// Load environment variables
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.development' });

// Set development environment
process.env.NODE_ENV = 'development';
process.env.USE_MONGODB = 'true';
process.env.DATA_SOURCE = 'mongodb';

console.log('🔧 Environment Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT || '5500'}`);
console.log(`   USE_MONGODB: ${process.env.USE_MONGODB}`);
console.log(`   DATA_SOURCE: ${process.env.DATA_SOURCE}`);
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);

// Kill any existing processes on the port
const port = process.env.PORT || 5500;
exec(`lsof -ti:${port} | xargs kill -9`, (error) => {
  console.log(`🛑 Cleared port ${port}`);
  
  // Start the application
  console.log('\n🌐 Starting backend server...\n');
  require('./start.js');
});
