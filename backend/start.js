#!/usr/bin/env node

// Application Startup Script with Environment-Based Configuration
// This script initializes the database and starts the server with proper environment handling

// Load environment-specific configuration
const config = require('./src/config');

const express = require('express');
const databaseService = require('./src/services/databaseService');

async function startApplication() {
  console.log('🚀 Starting ShaadiMantra Backend...\n');
  
  // Display environment information
  console.log('🔧 Environment Configuration:');
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Data Source: ${config.DATA_SOURCE.toUpperCase()}`);
  console.log(`   Port: ${config.PORT}`);
  console.log(`   Database: ${config.DATABASE.URI ? config.DATABASE.URI.replace(/:[^:@]*@/, ':***@') : 'Static/Mock Mode'}`);
  console.log(`   Debug Mode: ${config.FEATURES.DEBUG_MODE}`);
  console.log('');

  try {
    // Initialize database connection only if using MongoDB data source
    if (config.DATA_SOURCE === 'mongodb' && config.DATABASE.URI) {
      console.log('📊 Initializing MongoDB connection...');
      await databaseService.connect();
      console.log('✅ MongoDB connected successfully');
      console.log(`📦 Database: ${config.DATABASE.NAME}\n`);
    } else {
      console.log('📊 Using Static/Mock Data - No database connection needed');
      console.log('✅ Mock controllers loaded successfully\n');
    }

    // Start the Express server
    console.log('🌐 Starting Express server...');
    const app = require('./src/index');
    
    const server = app.listen(config.PORT, () => {
      console.log(`✅ Server running on port ${config.PORT}`);
      console.log(`📍 Health check: http://localhost:${config.PORT}/health`);
      console.log(`📍 API base: http://localhost:${config.PORT}/api`);
      console.log(`📍 Database status: http://localhost:${config.PORT}/health/database`);
      
      console.log('\n🎉 Application started successfully!');
      console.log('\n📚 Available API endpoints:');
      console.log('   POST /api/auth/send-otp - Send OTP to email');
      console.log('   POST /api/auth/verify-otp - Verify OTP and login');
      console.log('   POST /api/auth/refresh-token - Refresh JWT token');
      console.log('   POST /api/auth/logout - Logout user');
      console.log('   GET  /api/auth/profile - Get user profile (auth required)');
      console.log('   GET  /api/profiles/me - Get user profile (auth required)');
      console.log('   PUT  /api/profiles/me - Update user profile (auth required)');
      console.log('   GET  /api/profiles - Get profiles for matching (auth required)');
      console.log('   POST /api/upload/single - Upload single file (auth required)');
      console.log('   POST /api/upload/multiple - Upload multiple files (auth required)');
      console.log('   POST /api/invitations - Create invitation (auth required)');
      console.log('   GET  /api/invitations/:code - Get invitation by code');
      
      if (config.FEATURES.DEBUG_MODE) {
        console.log('\n🐛 Debug mode is enabled');
        console.log('   - Detailed error messages');
        console.log('   - Request/response logging');
        console.log('   - Development OTP responses');
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
      
      server.close(async () => {
        console.log('🛑 HTTP server closed');
        
        if (config.DATABASE.URI) {
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
    
    if (error.message.includes('connect')) {
      console.log('\n💡 MongoDB connection failed. Try:');
      console.log('   1. Check if MONGODB_URI is set correctly in environment');
      console.log('   2. Ensure MongoDB cluster is accessible (Atlas)');
      console.log('   3. Verify database credentials and network access');
      console.log('   4. Check if IP is whitelisted in MongoDB Atlas');
    }
    
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  startApplication();
}

module.exports = startApplication;
