
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(__dirname, '../', envFile) });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { User, Session, Connection, DailyLike } = require('../src/models');
const config = require('../src/config');

async function cleanupTestData() {
  // --- PRODUCTION GUARD ---
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ FATAL: Cannot run cleanup-test-data in PRODUCTION environment.');
    console.error('This script deletes user data and is restricted to development/test only.');
    process.exit(1);
  }

  const testPhones = [
    '9354799303', // Incomplete
    '9898989898', // Admin
    '9999999999', // Fresh
    '9876543210'  // Complete
  ];

  console.log(`🧹 Cleaning up test data for personas: ${testPhones.join(', ')}...`);

  try {
    const mongoUri = config.DATABASE.URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in config');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    for (const testPhone of testPhones) {
      const user = await User.findOne({ phoneNumber: testPhone });
      
      if (user) {
        const userId = user._id;
        const userUuid = user.userUuid;

        // Delete associated data
        const sessionResult = await Session.deleteMany({ userId });
        const connectionResult = await Connection.deleteMany({ 
          $or: [{ requester: userId }, { recipient: userId }] 
        });
        const likesResult = await DailyLike.deleteMany({ userId });
        
        // Delete user
        await User.deleteOne({ _id: userId });

        console.log(`✅ Deleted user: ${user.email} (${userUuid})`);
        console.log(`   - Sessions: ${sessionResult.deletedCount}`);
        console.log(`   - Connections: ${connectionResult.deletedCount}`);
        console.log(`   - Daily Likes: ${likesResult.deletedCount}`);
      }
    }

    // Also clean up any other users marked as "mock" or "test"
    const mockResult = await User.deleteMany({ 
      $or: [
        { email: /test/i },
        { email: /mock/i },
        { isTestUser: true }
      ]
    });
    if (mockResult.deletedCount > 0) {
      console.log(`✅ Deleted ${mockResult.deletedCount} additional mock/test users`);
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

cleanupTestData();
