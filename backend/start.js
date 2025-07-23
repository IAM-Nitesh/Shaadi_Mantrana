#!/usr/bin/env node

// Application Startup Script with MongoDB Integration
// This script initializes the database and starts the server

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const databaseService = require('./src/services/databaseService');
const { USE_MONGODB } = require('./src/config/controllers');

// MongoDB Configuration Verification Function
function verifyMongoDBConfiguration() {
  console.log('🔧 MongoDB Configuration Verification\n');

  // Check current environment variables
  console.log('📋 Current Environment Variables:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`DATA_SOURCE: ${process.env.DATA_SOURCE || 'not set'}`);
  console.log(`USE_MONGODB: ${process.env.USE_MONGODB || 'not set'}`);
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET (hidden)' : 'not set'}`);

  // Import and show controller configuration
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

  console.log('\n' + '='.repeat(50) + '\n');
}

async function startApplication() {
  console.log('🚀 Starting ShaadiMantra Backend...\n');

  // Verify MongoDB configuration before starting
  verifyMongoDBConfiguration();

  try {
    // Initialize database if using MongoDB
    if (USE_MONGODB) {
      console.log('📊 Initializing MongoDB connection...');
      await databaseService.connect();
      console.log('✅ MongoDB connected successfully\n');
    } else {
      console.log('💾 Running in memory-only mode (no MongoDB)\n');
    }

    // Start the Express server
    console.log('🌐 Starting Express server...');
    const { app } = require('./src/index');
    
    const PORT = process.env.PORT || 5001;
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API base: http://localhost:${PORT}/api`);
      
      if (USE_MONGODB) {
        console.log(`📍 Database status: http://localhost:${PORT}/health/database`);
      }
      
      console.log('\n🎉 Application started successfully!');
      console.log('\n📚 Available API endpoints:');
      console.log('   POST /api/auth/send-otp - Send OTP to email');
      console.log('   POST /api/auth/verify-otp - Verify OTP and login');
      console.log('   GET  /api/profiles/me - Get user profile');
      console.log('   PUT  /api/profiles/me - Update user profile');
      console.log('   GET  /api/profiles - Get profiles for matching');
      console.log('   POST /api/invitations - Create invitation');
      console.log('   GET  /api/invitations/:code - Get invitation by code');
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
      
      server.close(async () => {
        console.log('🛑 HTTP server closed');
        
        if (USE_MONGODB) {
          try {
            await databaseService.disconnect();
            console.log('📊 Database disconnected');
          } catch (error) {
            console.error('❌ Error disconnecting database:', error.message);
          }
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });

      // Force close after timeout
      setTimeout(() => {
        console.error('⚠️  Forcing shutdown...');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start application:', error.message);
    console.error('Stack:', error.stack);
    
    if (USE_MONGODB && error.message.includes('connect')) {
      console.log('\n💡 MongoDB connection failed. Try:');
      console.log('   1. Check if MONGODB_URI is set correctly in .env');
      console.log('   2. Ensure MongoDB is running (local) or accessible (Atlas)');
      console.log('   3. Verify database credentials and network access');
      console.log('   4. Set USE_MONGODB=false to run without database');
    }
    
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  startApplication();
}

module.exports = startApplication;
