// Test Script for Chat Phase 2 - Updated Chat Controller
const mongoose = require('mongoose');
const { Message, Conversation, User, Connection } = require('../src/models');
const chatController = require('../src/controllers/chatControllerMongo');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shaadi_mantra_test',
  testTimeout: 10000
};

// Mock request and response objects
class MockRequest {
  constructor(data = {}) {
    this.user = data.user || { userId: new mongoose.Types.ObjectId() };
    this.params = data.params || {};
    this.query = data.query || {};
    this.body = data.body || {};
    this.ip = data.ip || '127.0.0.1';
    this.get = (header) => data.headers?.[header] || 'Test User Agent';
    this.io = data.io || null;
  }
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.body = null;
    this.headers = {};
  }

  status(code) {
    this.statusCode = code;
    return this;
  }

  json(data) {
    this.body = data;
    return this;
  }
}

// ...rest of file preserved...

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new ChatPhase2Tester();
  tester.runAllTests().catch(console.error);
}

module.exports = ChatPhase2Tester; 
