// Check user status in database
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User } = require('../src/models');

async function checkUserStatus() {
  try {
    console.log('🔍 Checking user status in database...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users in database`);

    users.forEach(user => {
      console.log(`\n📧 User: ${user.email}`);
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
      console.log(`\n🔍 Test user details:`);
      console.log(`   - Email: ${testUser.email}`);
      console.log(`   - Role: ${testUser.role}`);
      console.log(`   - Status: ${testUser.status}`);
      console.log(`   - isApprovedByAdmin: ${testUser.isApprovedByAdmin}`);
      console.log(`   - isFirstLogin: ${testUser.isFirstLogin}`);
    } else {
      console.log('\n❌ Test user not found');
    }

    console.log('\n✅ User status check completed');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run check
checkUserStatus(); 