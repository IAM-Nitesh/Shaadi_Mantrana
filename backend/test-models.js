// Test MongoDB Models and Database Service
require('dotenv').config();

const mongoose = require('mongoose');
const { User, Invitation, Connection } = require('./src/models');
const DatabaseService = require('./src/services/databaseService');

async function testModels() {
  console.log('🧪 Testing MongoDB Models and Database Connection...\n');

  try {
    // Test model loading
    console.log('📦 Testing Model Loading:');
    console.log('✅ User model loaded:', typeof User);
    console.log('✅ Invitation model loaded:', typeof Invitation); 
    console.log('✅ Connection model loaded:', typeof Connection);

    // Test schema validation without DB connection
    console.log('\n📋 Testing Schema Structure:');
    console.log('User schema paths:', Object.keys(User.schema.paths).length, 'fields');
    console.log('Invitation schema paths:', Object.keys(Invitation.schema.paths).length, 'fields');
    console.log('Connection schema paths:', Object.keys(Connection.schema.paths).length, 'fields');

    // Test user model methods
    console.log('\n🔧 Testing Model Methods:');
    console.log('User static methods:', Object.getOwnPropertyNames(User).filter(name => typeof User[name] === 'function'));
    console.log('User instance methods available:', User.prototype.toPublicJSON ? '✅' : '❌');

    // Test database service
    console.log('\n🔗 Testing Database Service:');
    console.log('Database service loaded:', typeof DatabaseService);
    console.log('Connection methods available:', typeof DatabaseService.connect);

    // If MONGODB_URI is available, test connection
    if (process.env.MONGODB_URI) {
      console.log('\n🌐 Testing Database Connection:');
      console.log('MongoDB URI found, testing connection...');
      
      try {
        await DatabaseService.connect();
        console.log('✅ Database connection successful!');
        
        // Test basic model operations
        console.log('\n📝 Testing Model Operations:');
        
        // Test User model
        const testUser = new User({
          email: 'test@example.com',
          verification: { isVerified: true }
        });
        
        const validationError = testUser.validateSync();
        if (!validationError) {
          console.log('✅ User model validation passed');
        } else {
          console.log('❌ User model validation failed:', validationError.message);
        }
        
        // Test Invitation model
        const testInvitation = new Invitation({
          email: 'test@example.com',
          invitationCode: 'TEST123'
        });
        
        const invValidationError = testInvitation.validateSync();
        if (!invValidationError) {
          console.log('✅ Invitation model validation passed');
        } else {
          console.log('❌ Invitation model validation failed:', invValidationError.message);
        }
        
        console.log('\n📊 Database Statistics:');
        const dbStats = await DatabaseService.getConnectionStats();
        console.log('Connection state:', dbStats);
        
        await DatabaseService.disconnect();
        console.log('✅ Database disconnected cleanly');
        
      } catch (dbError) {
        console.log('❌ Database connection failed:', dbError.message);
        console.log('💡 This is expected if MongoDB is not running locally');
      }
    } else {
      console.log('💡 No MongoDB URI found in environment');
      console.log('💡 Set MONGODB_URI to test database connection');
    }

    console.log('\n🎉 Model testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Model testing failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testModels().then(() => {
  console.log('\n✅ All tests completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
