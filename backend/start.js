#!/usr/bin/env node

// Application Startup Script with MongoDB Integration
// This script initializes the database and starts the server

require('dotenv').config();

const express = require('express');
const databaseService = require('./src/services/databaseService');
const { USE_MONGODB } = require('./src/config/controllers');

async function startApplication() {
  console.log('🚀 Starting ShaadiMantra Backend...\n');

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
    const app = require('./src/index');
    
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
