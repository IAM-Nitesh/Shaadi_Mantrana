#!/usr/bin/env node

// MongoDB Configuration Verification Script
// Checks if MongoDB flags are properly set for both dev and prod

require('dotenv').config();

console.log('🔧 MongoDB Configuration Verification\n');

// Check current environment variables
console.log('📋 Current Environment Variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`DATA_SOURCE: ${process.env.DATA_SOURCE || 'not set'}`);
console.log(`USE_MONGODB: ${process.env.USE_MONGODB || 'not set'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET (hidden)' : 'not set'}`);

// Import controller configuration
const { USE_MONGODB } = require('./src/config/controllers');
console.log(`\n🎛️  Controller Configuration:`);
console.log(`USE_MONGODB flag: ${USE_MONGODB}`);

// Verify MongoDB setup
if (USE_MONGODB) {
  console.log('\n✅ MongoDB Configuration Status: ENABLED');
  console.log('   - Controllers will use MongoDB implementations');
  console.log('   - Database service will attempt MongoDB connection');
  
  if (process.env.MONGODB_URI) {
    console.log('   - MongoDB connection string is configured');
  } else {
    console.log('   - ⚠️  Warning: No MONGODB_URI found');
  }
} else {
  console.log('\n❌ MongoDB Configuration Status: DISABLED');
  console.log('   - Controllers will use memory-based implementations');
  console.log('   - No database connection will be attempted');
}

// Check different environment configurations
console.log('\n🌍 Environment-Specific Configurations:');

// Development
try {
  require('dotenv').config({ path: '.env.development' });
  const devDataSource = process.env.DATA_SOURCE;
  const devUseMongoDb = process.env.USE_MONGODB;
  console.log(`Development: DATA_SOURCE=${devDataSource}, USE_MONGODB=${devUseMongoDb}`);
} catch (err) {
  console.log('Development: Config file not found or error loading');
}

// Production
try {
  require('dotenv').config({ path: '.env.production' });
  const prodDataSource = process.env.DATA_SOURCE;
  const prodUseMongoDb = process.env.USE_MONGODB;
  console.log(`Production: DATA_SOURCE=${prodDataSource}, USE_MONGODB=${prodUseMongoDb}`);
} catch (err) {
  console.log('Production: Config file not found or error loading');
}

console.log('\n✅ MongoDB Configuration Verification Complete');
