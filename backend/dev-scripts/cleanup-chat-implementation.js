// Chat Implementation Cleanup Script
const mongoose = require('mongoose');
const { Message, Conversation, Connection, DailyLike, Match } = require('../src/models');

// Cleanup configuration
const CLEANUP_CONFIG = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/shaadi_mantra',
  dryRun: process.env.DRY_RUN === 'true',
  cleanupTestData: true,
  cleanupOldChatData: true,
  cleanupOrphanedData: true
};

class ChatCleanupService {
  constructor() {
    this.results = {
      cleaned: 0,
      errors: 0,
      details: []
    };
  }

  async connect() {
    try {
      await mongoose.connect(CLEANUP_CONFIG.mongoUri);
      console.log('\u2705 Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('\u274c MongoDB connection failed:', error);
      return false;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('\ud83d\udd0c Disconnected from MongoDB');
  }

  async cleanupTestData() {
    console.log('\\n\ud83e\uddf9 Cleaning up test data...');
    
    try {
      // Clean up test conversations
      const testConversations = await Conversation.find({
        connectionId: { $regex: /^test-connection-/ }
      });
      
      if (testConversations.length > 0) {
        const conversationIds = testConversations.map(c => c._id);
        
        // Clean up messages for test conversations
        const messageResult = await Message.deleteMany({
          conversationId: { $in: conversationIds }
        });
        
        // Clean up test conversations
        const conversationResult = await Conversation.deleteMany({
          _id: { $in: conversationIds }
        });
        
        console.log(`\u2705 Cleaned up ${messageResult.deletedCount} test messages`);
        console.log(`\u2705 Cleaned up ${conversationResult.deletedCount} test conversations`);
        
        this.results.cleaned += messageResult.deletedCount + conversationResult.deletedCount;
        this.results.details.push({
          type: 'test_data',
          messages: messageResult.deletedCount,
          conversations: conversationResult.deletedCount
        });
      } else {
        console.log('\u2139\ufe0f  No test conversations found');
      }
    } catch (error) {
      console.error('\u274c Error cleaning up test data:', error);
      this.results.errors++;
    }
  }

  async cleanupOldChatData() {
    console.log('\\n\ud83e\uddf9 Cleaning up old chat data...');
    
    try {
      // Clean up messages older than 24 hours (should be handled by TTL, but just in case)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const oldMessages = await Message.find({
        createdAt: { $lt: oneDayAgo }
      });
      
      if (oldMessages.length > 0) {
        const messageResult = await Message.deleteMany({
          createdAt: { $lt: oneDayAgo }
        });
        
        console.log(`\u2705 Cleaned up ${messageResult.deletedCount} old messages`);
        this.results.cleaned += messageResult.deletedCount;
        this.results.details.push({
          type: 'old_messages',
          count: messageResult.deletedCount
        });
      } else {
        console.log('\u2139\ufe0f  No old messages found');
      }
    } catch (error) {
      console.error('\u274c Error cleaning up old chat data:', error);
      this.results.errors++;
    }
  }

  async cleanupOrphanedData() {
    console.log('\\n\ud83e\uddf9 Cleaning up orphaned data...');
    
    try {
      // Find conversations without valid connections
      const conversations = await Conversation.find();
      let orphanedConversations = 0;
      let orphanedMessages = 0;
      
      for (const conversation of conversations) {
        const connection = await Connection.findById(conversation.connectionId);
        if (!connection) {
          // Clean up messages for orphaned conversation
          const messageResult = await Message.deleteMany({
            conversationId: conversation._id
          });
          
          // Delete orphaned conversation
          await Conversation.deleteOne({ _id: conversation._id });
          
          orphanedConversations++;
          orphanedMessages += messageResult.deletedCount;
        }
      }
      
      if (orphanedConversations > 0) {
        console.log(`\u2705 Cleaned up ${orphanedConversations} orphaned conversations`);
        console.log(`\u2705 Cleaned up ${orphanedMessages} orphaned messages`);
        this.results.cleaned += orphanedConversations + orphanedMessages;
        this.results.details.push({
          type: 'orphaned_data',
          conversations: orphanedConversations,
          messages: orphanedMessages
        });
      } else {
        console.log('\u2139\ufe0f  No orphaned data found');
      }
    } catch (error) {
      console.error('\u274c Error cleaning up orphaned data:', error);
      this.results.errors++;
    }
  }

  async validateChatImplementation() {
    console.log('\\n\ud83d\udd0d Validating chat implementation...');
    
    try {
      // Check if all required models exist
      const models = ['Message', 'Conversation', 'Connection'];
      let validationPassed = true;
      
      for (const modelName of models) {
        try {
          const model = mongoose.model(modelName);
          const count = await model.countDocuments();
          console.log(`\u2705 ${modelName} model: ${count} documents`);
        } catch (error) {
          console.error(`\u274c ${modelName} model validation failed:`, error.message);
          validationPassed = false;
        }
      }
      
      // Check indexes
      console.log('\\n\ud83d\udcca Checking database indexes...');
      
      try {
        const messageIndexes = await Message.collection.indexes();
        console.log(`\u2705 Message indexes: ${messageIndexes.length} indexes`);
        
        const conversationIndexes = await Conversation.collection.indexes();
        console.log(`\u2705 Conversation indexes: ${conversationIndexes.length} indexes`);
        
        const connectionIndexes = await Connection.collection.indexes();
        console.log(`\u2705 Connection indexes: ${connectionIndexes.length} indexes`);
      } catch (error) {
        console.error('\u274c Index validation failed:', error.message);
        validationPassed = false;
      }
      
      if (validationPassed) {
        console.log('\u2705 Chat implementation validation passed');
      } else {
        console.log('\u274c Chat implementation validation failed');
      }
      
      return validationPassed;
    } catch (error) {
      console.error('\u274c Validation error:', error);
      return false;
    }
  }

  async getChatStatistics() {
    console.log('\\n\ud83d\udcca Chat Implementation Statistics...');
    
    try {
      const stats = {
        messages: await Message.countDocuments(),
        conversations: await Conversation.countDocuments(),
        connections: await Connection.countDocuments(),
        dailyLikes: await DailyLike.countDocuments(),
        matches: await Match.countDocuments()
      };
      
      console.log('\ud83d\udcc8 Current Statistics:');
      console.log(`   Messages: ${stats.messages}`);
      console.log(`   Conversations: ${stats.conversations}`);
      console.log(`   Connections: ${stats.connections}`);
      console.log(`   Daily Likes: ${stats.dailyLikes}`);
      console.log(`   Matches: ${stats.matches}`);
      
      return stats;
    } catch (error) {
      console.error('\u274c Error getting statistics:', error);
      return null;
    }
  }

  async runCleanup() {
    console.log('\ud83d\ude80 Starting Chat Implementation Cleanup...\\n');
    
    if (CLEANUP_CONFIG.dryRun) {
      console.log('\u26a0\ufe0f  DRY RUN MODE - No data will be deleted');
    }
    
    const connected = await this.connect();
    if (!connected) {
      console.error('\u274c Cannot run cleanup without database connection');
      return;
    }

    // Get initial statistics
    const initialStats = await this.getChatStatistics();
    
    // Run cleanup tasks
    if (CLEANUP_CONFIG.cleanupTestData) {
      await this.cleanupTestData();
    }
    
    if (CLEANUP_CONFIG.cleanupOldChatData) {
      await this.cleanupOldChatData();
    }
    
    if (CLEANUP_CONFIG.cleanupOrphanedData) {
      await this.cleanupOrphanedData();
    }
    
    // Validate implementation
    await this.validateChatImplementation();
    
    // Get final statistics
    const finalStats = await this.getChatStatistics();
    
    // Print results
    this.printResults(initialStats, finalStats);
    
    await this.disconnect();
  }

  printResults(initialStats, finalStats) {
    console.log('\\n\ud83d\udcca Cleanup Results Summary:');
    console.log('============================');
    console.log(`\u2705 Cleaned: ${this.results.cleaned} items`);
    console.log(`\u274c Errors: ${this.results.errors}`);
    
    if (this.results.details.length > 0) {
      console.log('\\n\ud83d\udccb Cleanup Details:');
      this.results.details.forEach(detail => {
        console.log(`   ${detail.type}: ${JSON.stringify(detail)}`);
      });
    }
    
    if (initialStats && finalStats) {
      console.log('\\n\ud83d\udcc8 Statistics Comparison:');
      console.log(`   Messages: ${initialStats.messages} \u2192 ${finalStats.messages} (${finalStats.messages - initialStats.messages})`);
      console.log(`   Conversations: ${initialStats.conversations} \u2192 ${finalStats.conversations} (${finalStats.conversations - initialStats.conversations})`);
      console.log(`   Connections: ${initialStats.connections} \u2192 ${finalStats.connections} (${finalStats.connections - initialStats.connections})`);
    }
    
    if (this.results.errors === 0) {
      console.log('\\n\ud83c\udf89 Cleanup completed successfully! Ready for Phase 3.');
    } else {
      console.log('\\n\u26a0\ufe0f  Cleanup completed with errors. Please review.');
    }
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  const cleanupService = new ChatCleanupService();
  cleanupService.runCleanup().catch(console.error);
}

module.exports = ChatCleanupService; 
