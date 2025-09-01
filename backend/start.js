#!/usr/bin/env node

// Enable on-the-fly JSX/ES transpilation for backend email components
try {
  require('@babel/register')({
    extensions: ['.js', '.jsx'],
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      '@babel/preset-react'
    ],
    ignore: [/node_modules/]
  });
} catch (e) {
  // If @babel/register isn't installed, startup will continue and fail later with a helpful error.
  // Install dev deps with: npm install @babel/register @babel/core @babel/preset-env @babel/preset-react
}

// Application Startup Script with Environment-Based Configuration
// This script initializes the database and starts the server with proper environment handling

// Load environment-specific configuration
const config = require('./src/config');

const express = require('express');
const databaseService = require('./src/services/databaseService');

async function startApplication() {
  console.log('🚀 Starting ShaadiMantrana Backend...\n');
  
  // Display environment information (production-safe)
  console.log('🔧 Environment Configuration:');
  console.log(`   Environment: ${config.NODE_ENV}`);
  console.log(`   Data Source: ${config.DATA_SOURCE.toUpperCase()}`);
  console.log(`   Port: ${config.PORT}`);
  
  // Only show database details in development
  if (!config.isProduction) {
    console.log(`   Database: ${config.DATABASE.URI ? config.DATABASE.URI.replace(/:[^:@]*@/, ':***@') : 'MongoDB URI not configured'}`);
  } else {
    console.log(`   Database: ${config.DATABASE.NAME} (${config.DATABASE.URI ? 'configured' : 'not configured'})`);
  }
  
  console.log(`   Debug Mode: ${config.FEATURES.DEBUG_MODE}`);
  console.log(`   Email Service: ${process.env.SMTP_USER ? 'Configured' : 'Not configured'}`);
  console.log('');

  try {
    // Initialize database connection only if using MongoDB data source
    if (config.DATA_SOURCE === 'mongodb' && config.DATABASE.URI) {
      console.log('📊 Initializing MongoDB connection...');
      await databaseService.connect();
      console.log('✅ MongoDB connected successfully');
      console.log(`📦 Database: ${config.DATABASE.NAME}`);
      
      if (!config.isProduction) {
        console.log('🗄️ Collections:');
        console.log('   - users: User profiles and authentication data');
        console.log('   - invitations: Invitation history and tracking');
        console.log('   - connections: User connection requests and status');
        console.log('');
      }
    } else {
        console.log('📊 MongoDB mode - Database connection required');
  console.log('✅ MongoDB controllers loaded successfully\n');
    }

    // Start the Express server
    console.log('🌐 Starting Express server...');
    const app = require('./src/index');
    
    const server = app.listen(config.PORT, () => {
      console.log(`✅ Server running on port ${config.PORT}`);
      
      // Start session cleanup service if using MongoDB
      if (config.DATA_SOURCE === 'mongodb' && config.DATABASE.URI) {
        try {
          const sessionCleanupService = require('./src/services/sessionCleanupService');
          sessionCleanupService.start();
          console.log('🧹 Session cleanup service started');
        } catch (error) {
          console.warn('⚠️  Could not start session cleanup service:', error.message);
        }
      }
      
      // Production-friendly logging - less verbose
      if (config.isProduction) {
        console.log(`📍 Health check: /health`);
        console.log(`📍 API base: /api`);
        console.log(`📍 Environment: ${config.NODE_ENV}`);
        console.log(`📦 Database: ${config.DATABASE.NAME}`);
      } else {
        // Development logging - more detailed
        console.log(`📍 Health check: http://localhost:${config.PORT}/health`);
        console.log(`📍 API base: http://localhost:${config.PORT}/api`);
        console.log(`📍 Database status: http://localhost:${config.PORT}/health/database`);
        
        console.log('\n🎉 Application started successfully!');
        console.log('\n📚 Available API endpoints:');
        console.log('\n🔐 Authentication Endpoints:');
        console.log('   POST /api/auth/send-otp - Send OTP to email (admin approval required)');
        console.log('   POST /api/auth/verify-otp - Verify OTP and login');
        console.log('   POST /api/auth/refresh-token - Refresh JWT token');
        console.log('   POST /api/auth/logout - Logout user');
        console.log('   GET  /api/auth/preapproved/check - Check if email is approved (User collection)');
        
        console.log('\n👤 Profile Endpoints (Auth Required):');
        console.log('   GET  /api/profiles/me - Get user profile');
        console.log('   PUT  /api/profiles/me - Update user profile');
        console.log('   GET  /api/profiles - Get profiles for matching');
        console.log('   GET  /api/profiles/uuid/:uuid - Get profile by UUID (public)');
        console.log('   DELETE /api/profiles/me - Deactivate user profile');
        
        console.log('\n📤 Upload Endpoints (Auth Required):');
        console.log('   POST /api/upload/single - Upload single file');
        console.log('   POST /api/upload/multiple - Upload multiple files');
        
        console.log('\n📨 Invitation Endpoints:');
        console.log('   POST /api/invitations - Create invitation (admin only)');
        console.log('   GET  /api/invitations - Get all invitations (admin only)');
        console.log('   GET  /api/invitations/:id - Get invitation by ID');
        
        console.log('\n⚙️ Admin Endpoints (Admin Auth Required):');
        console.log('   GET  /api/admin/users - Get all users with approval status');
        console.log('   POST /api/admin/users - Add new user (creates approved user entry)');
        console.log('   POST /api/admin/users/:userId/pause - Pause user');
        console.log('   POST /api/admin/users/:userId/resume - Resume user');
        console.log('   POST /api/admin/users/:userId/invite - Send invitation to user');
        console.log('   POST /api/admin/users/send-bulk-invites - Send bulk invitations');
        console.log('   GET  /api/admin/stats - Get comprehensive admin statistics');
        console.log('   GET  /api/admin/users/:userId/invitations - Get user invitation history');
        
        console.log('\n🔗 Connection Endpoints (Auth Required):');
        console.log('   POST /api/connections - Create connection request');
        console.log('   GET  /api/connections - Get user connections');
        console.log('   PATCH /api/connections/:id - Update connection status');
        
        if (config.FEATURES.DEBUG_MODE) {
          console.log('\n🐛 Debug mode is enabled');
          console.log('   - Detailed error messages');
          console.log('   - Request/response logging');
          console.log('   - Development OTP responses');
        }
        
        console.log('\n🔐 Admin Approval System:');
        console.log('   - Only admin-approved emails can register/login');
        console.log('   - Admin can add, pause, and resume users');
        console.log('   - Complete invitation history tracking');
        console.log('   - Database-driven approval workflow');
        
        console.log('\n📋 Quick Start:');
        console.log('   1. Admin adds user via /api/admin/users');
        console.log('   2. User receives invitation email');
        console.log('   3. User can login with OTP verification');
        console.log('   4. Admin can manage user status via admin endpoints');
        
        console.log('\n🧪 Testing:');
        console.log('   npm run test:admin-approval - Test admin approval workflow');
        console.log('   npm run test:auth-flow - Test authentication with admin approval');
        console.log(`   curl http://localhost:${config.PORT}/health - Health check`);
        console.log(`   curl http://localhost:${config.PORT}/api/auth/preapproved/check?email=test@example.com - Test approval check`);
      }
    });

    // Initialize Socket.IO chat service so websocket endpoint is available
    try {
      const chatService = require('./src/services/chatService');
      if (chatService && typeof chatService.initialize === 'function') {
        chatService.initialize(server);
        if (!config.isProduction) {
          console.log('💬 Socket.IO chat service initialized from start script');
        }
      }
    } catch (e) {
      if (!config.isProduction) {
        console.warn('⚠️  Failed to initialize Socket.IO from start script:', e && e.message);
      }
    }

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
      
      // Try to close Socket.IO if present
      try {
        const chatService = require('./src/services/chatService');
        if (chatService && chatService.io && typeof chatService.io.close === 'function') {
          chatService.io.close(() => {
            console.log('🛑 Socket.IO server closed');
          });
        }
      } catch (e) {
        // ignore errors during shutdown
      }

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
    
    // Don't log full stack trace in production
    if (!config.isProduction) {
      console.error('Stack:', error.stack);
    }
    
    if (error.message.includes('connect')) {
      console.log('\n💡 Database connection failed.');
      if (!config.isProduction) {
        console.log('   Check MONGODB_URI and network access');
      }
    }
    
    if (error.message.includes('preApprovedEmailService')) {
      console.log('\n💡 Legacy service error detected');
      if (!config.isProduction) {
        console.log('   Old email approval system has been replaced');
      }
    }
    
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  startApplication();
}

module.exports = startApplication;
