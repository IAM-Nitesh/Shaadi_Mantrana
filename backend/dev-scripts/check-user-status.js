// Check user status in database
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User } = require('../src/models');

async function checkUserStatus() {
  try {
    console.log('\ud83d\udd0d Checking user status in database...');
    
    // Connect to MongoDB (env-driven)
    const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI || '';
    if (!mongoUri) {
      console.error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment or .env.development');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`\ud83d\udc65 Found ${users.length} users in database`);

    users.forEach(user => {
      console.log(`\\n\ud83d\udce7 User: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Status: ${user.status}`);
      console.log(`   - isApprovedByAdmin: ${user.isApprovedByAdmin}`);
      console.log(`   - isFirstLogin: ${user.isFirstLogin}`);
      console.log(`   - addedAt: ${user.addedAt}`);
      console.log(`   - addedBy: ${user.addedBy}`);
      console.log(`   - Created: ${user.createdAt}`);
    });

    // Test specific user
    const testUser = await User.findOne({ email: 'niteshkumar9591@gmail.com' });
    if (testUser) {
      console.log('\\n\ud83d\udd0d Test user details:');
      console.log(`   - Email: ${testUser.email}`);
      console.log(`   - Role: ${testUser.role}`);
      console.log(`   - Status: ${testUser.status}`);
      console.log(`   - isApprovedByAdmin: ${testUser.isApprovedByAdmin}`);
      console.log(`   - isFirstLogin: ${testUser.isFirstLogin}`);
    } else {
      console.log('\\n\u274c Test user not found');
    }

    console.log('\\n\u2705 User status check completed');
    
  } catch (error) {
    console.error('\u274c Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\ud83d\udd0c Disconnected from MongoDB');
  }
}

// Run check
checkUserStatus(); 
