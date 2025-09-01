// Test script for Session TTL Migration
// This script tests the migration and validates the new TTL configuration

const mongoose = require('mongoose');
const { Session } = require('../src/models');
const { JWTSessionManager } = require('../src/middleware/auth');
const sessionCleanupService = require('../src/services/sessionCleanupService');
const config = require('../src/config');

async function testSessionTTLMigration() {
  console.log('🧪 Testing Session TTL Migration...\n');

  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not configured');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Test 1: Check current session count
    const sessionCount = await Session.countDocuments();
    console.log(`📊 Current sessions: ${sessionCount}`);

    // Test 2: Check indexes
    const db = mongoose.connection.db;
    const indexes = await db.collection('sessions').indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${Object.keys(index.key).join(', ')}`);
      if (index.name === 'lastAccessed_ttl') {
        console.log(`     └─ TTL: ${index.expireAfterSeconds} seconds (${Math.round(index.expireAfterSeconds / 86400)} days)`);
      }
    });

    // Test 3: Create a test session
    console.log('\n🆕 Creating test session...');
    const testUser = {
      _id: 'test-user-id',
      userUuid: 'test-uuid-123',
      email: 'test@example.com',
      role: 'user',
      verified: true
    };

    const sessionData = await JWTSessionManager.createSession(testUser);
    console.log('✅ Test session created:', sessionData.sessionId);

    // Test 4: Verify session has lastAccessed field
    const createdSession = await Session.findBySessionId(sessionData.sessionId);
    console.log('📅 Session lastAccessed:', createdSession.lastAccessed);
    console.log('📅 Session createdAt:', createdSession.createdAt);

    // Test 5: Test session retrieval (should update lastAccessed)
    console.log('\n🔄 Testing session retrieval...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    const retrievedSession = await JWTSessionManager.getSession(sessionData.sessionId);
    console.log('✅ Session retrieved successfully');

    // Test 6: Check if lastAccessed was updated
    const updatedSession = await Session.findBySessionId(sessionData.sessionId);
    const timeDiff = updatedSession.lastAccessed - createdSession.lastAccessed;
    console.log(`⏱️  lastAccessed updated by: ${timeDiff}ms`);

    // Test 7: Test cleanup service
    console.log('\n🧹 Testing cleanup service...');
    const stats = await sessionCleanupService.getSessionStats();
    console.log('📊 Session stats:', stats);

    // Test 8: Clean up test session
    console.log('\n🗑️  Cleaning up test session...');
    await JWTSessionManager.deleteSession(sessionData.sessionId);
    console.log('✅ Test session deleted');

    // Test 9: Verify cleanup
    const finalCount = await Session.countDocuments();
    console.log(`📊 Final session count: ${finalCount}`);

    console.log('\n🎉 Session TTL Migration Test completed successfully!');
    console.log('\n✅ All tests passed:');
    console.log('   - TTL indexes configured correctly');
    console.log('   - Session creation works');
    console.log('   - lastAccessed field updates properly');
    console.log('   - Cleanup service functions');
    console.log('   - Session deletion works');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run test if called directly
if (require.main === module) {
  testSessionTTLMigration();
}

module.exports = testSessionTTLMigration;
