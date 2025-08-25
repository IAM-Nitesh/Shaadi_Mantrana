const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const { User } = require('../src/models');

async function testAdminFunctionality() {
  try {
    console.log('\ud83e\uddea Testing admin functionality...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`\ud83d\udc65 Found ${users.length} users`);

    // Find admin user
    const adminUser = await User.findOne({ email: 'codebynitesh@gmail.com' });
    if (!adminUser) {
      console.log('\u274c Admin user not found');
      return;
    }

    console.log(`\\n\ud83d\udc51 Admin user: ${adminUser.email}`);
    console.log(`   - Role: ${adminUser.role}`);
    console.log(`   - Status: ${adminUser.status}`);
    console.log(`   - isApprovedByAdmin: ${adminUser.isApprovedByAdmin}`);

    // Test pause functionality
    console.log('\\n\ud83d\udd04 Testing pause functionality...');
    
    // Pause a regular user
    const regularUser = await User.findOne({ email: 'niteshkumar9591@gmail.com' });
    if (regularUser) {
      console.log(`\ud83d\udce7 Pausing user: ${regularUser.email}`);
      regularUser.status = 'paused';
      await regularUser.save();
      console.log(`\u2705 User ${regularUser.email} paused successfully`);
    }

    // Resume the user
    console.log('\\n\ud83d\udd04 Testing resume functionality...');
    if (regularUser) {
      console.log(`\ud83d\udce7 Resuming user: ${regularUser.email}`);
      regularUser.status = 'active';
      await regularUser.save();
      console.log(`\u2705 User ${regularUser.email} resumed successfully`);
    }

    // Test admin approval functionality
    console.log('\\n\ud83d\udd04 Testing admin approval functionality...');
    
    // Create a test user
    const testUser = new User({
      email: 'test-admin@example.com',
      userUuid: 'test-uuid-' + Date.now(),
      role: 'user',
      status: 'invited',
      isApprovedByAdmin: false,
      isFirstLogin: true,
      profileCompleted: false,
      profile: {
        location: "India",
        profileCompleteness: 0,
        interests: [],
        images: ""
      },
      preferences: {
        ageRange: {
          min: 18,
          max: 50
        },
        location: [
          "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
          "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
          "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
          "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
          "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
          "Uttar Pradesh", "Uttarakhand", "West Bengal",
          "Andaman and Nicobar Islands", "Chandigarh",
          "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
          "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
        ],
        profession: [],
        education: []
      }
    });

    await testUser.save();
    console.log(`\u2705 Test user created: ${testUser.email}`);

    // Approve the test user
    testUser.isApprovedByAdmin = true;
    testUser.status = 'active';
    await testUser.save();
    console.log(`\u2705 Test user approved: ${testUser.email}`);

    // Pause the test user
    testUser.status = 'paused';
    await testUser.save();
    console.log(`\u2705 Test user paused: ${testUser.email}`);

    // Resume the test user
    testUser.status = 'active';
    await testUser.save();
    console.log(`\u2705 Test user resumed: ${testUser.email}`);

    // Clean up test user
    await User.deleteOne({ email: 'test-admin@example.com' });
    console.log(`\u2705 Test user cleaned up`);

    // Final status check
    console.log('\\n\ud83d\udcca Final user status:');
    const finalUsers = await User.find({});
    finalUsers.forEach(user => {
      console.log(`   - ${user.email}: ${user.status} (approved: ${user.isApprovedByAdmin})`);
    });

    console.log('\\n\u2705 Admin functionality test completed successfully!');
    
  } catch (error) {
    console.error('\u274c Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\ud83d\udd0c Disconnected from MongoDB');
  }
}

// Run test
testAdminFunctionality(); 
