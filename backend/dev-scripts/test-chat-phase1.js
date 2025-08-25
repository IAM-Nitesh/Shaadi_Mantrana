// Test Script for Chat Phase 1 - Message and Conversation Models
const mongoose = require('mongoose');
const { Message, Conversation, User, Connection } = require('../src/models');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shaadi_mantra_test',
  testTimeout: 10000
};

// Test data
const TEST_DATA = {
  userId1: new mongoose.Types.ObjectId(),
  userId2: new mongoose.Types.ObjectId(),
  connectionId: 'test-connection-123',
  messageContent: 'Hello, this is a test message!'
};

class ChatPhase1Tester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async connect() {
    try {
      await mongoose.connect(TEST_CONFIG.mongoUri);
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      return false;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }

  async cleanup() {
    try {
      await Message.deleteMany({});
      await Conversation.deleteMany({});
      console.log('🧹 Cleaned up test data');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async testConversationCreation() {
    console.log('\n🧪 Testing Conversation Creation...');
    
    try {
      const conversation = await Conversation.createConversation(
        TEST_DATA.connectionId,
        [TEST_DATA.userId1, TEST_DATA.userId2]
      );

      if (!conversation) {
        throw new Error('Conversation creation failed');
      }

      if (conversation.participants.length !== 2) {
        throw new Error('Conversation should have exactly 2 participants');
      }

      if (conversation.messageCount !== 0) {
        throw new Error('New conversation should have 0 messages');
      }

      console.log('✅ Conversation creation test passed');
      this.results.passed++;
      this.results.tests.push({ name: 'Conversation Creation', status: 'PASS' });
      
      return conversation;
    } catch (error) {
      console.error('❌ Conversation creation test failed:', error.message);
      this.results.failed++;
      this.results.tests.push({ name: 'Conversation Creation', status: 'FAIL', error: error.message });
      return null;
    }
  }

  // ...rest of file preserved...
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new ChatPhase1Tester();
  tester.runAllTests().catch(console.error);
}

module.exports = ChatPhase1Tester; 
