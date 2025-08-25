#!/usr/bin/env node

/**
 * Environment Configuration Check Script
 * Verifies environment setup and database connectivity
 */

const config = require('../src/config');

console.log('\ud83d\udd27 ShaadiMantrana Environment Configuration Check');
console.log('='.repeat(50));
console.log(`Environment: ${config.NODE_ENV}`);
console.log(`Port: ${config.PORT}`);
console.log(`Database URI: ${config.DATABASE.URI.replace(/:[^:@]*@/, ':***@')}`);
console.log(`Database Name: ${config.DATABASE.NAME}`);
console.log(`Frontend URL: ${config.FRONTEND_URL}`);
console.log(`Debug Mode: ${config.FEATURES.DEBUG_MODE}`);
console.log(`Email Enabled: ${config.FEATURES.ENABLE_EMAIL}`);
console.log(`Rate Limiting: ${config.FEATURES.ENABLE_RATE_LIMITING}`);
console.log(`JWT Secret: ${config.JWT.SECRET.substring(0, 10)}...`);
console.log('='.repeat(50));

// Test database connection
console.log('\ud83d\udd0d Testing database connection...');

const mongoose = require('mongoose');

// Set up connection options
const connectionOptions = {
  ...config.DATABASE.OPTIONS,
  serverSelectionTimeoutMS: 10000, // 10 second timeout for this test
};

mongoose.connect(config.DATABASE.URI, connectionOptions)
  .then(() => {
    console.log('\u2705 Database connection: SUCCESS');
    console.log(`\ud83d\udcca Connected to: ${mongoose.connection.db.databaseName}`);
    console.log(`\ud83c\udfe0 Host: ${mongoose.connection.host}`);
    console.log(`\ud83d\udce1 Ready state: ${mongoose.connection.readyState}`);
    
    // Test a simple operation
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('\u2705 Database ping: SUCCESS');
    console.log('\ud83c\udf89 Environment setup is working correctly!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\u274c Database connection: FAILED');
    console.error('Error details:', err.message);
    
    if (err.message.includes('authentication failed')) {
      console.error('\ud83d\udca1 Suggestion: Check your MongoDB credentials');
    } else if (err.message.includes('ENOTFOUND')) {
      console.error('\ud83d\udca1 Suggestion: Check your internet connection and MongoDB URI');
    } else if (err.message.includes('timeout')) {
      console.error('\ud83d\udca1 Suggestion: Check if MongoDB server is accessible');
    }
    
    console.log('\\n\ud83d\udccb Troubleshooting steps:');
    console.log('1. Verify your MONGODB_URI in the environment file');
    console.log('2. Check if your IP is whitelisted in MongoDB Atlas');
    console.log('3. Ensure your internet connection is stable');
    console.log('4. Verify MongoDB credentials are correct');
    
    process.exit(1);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\ud83d\uded1 Environment check interrupted');
  mongoose.connection.close();
  process.exit(0);
});
