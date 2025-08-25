#!/usr/bin/env node

/**
 * Create Test User for Admin Panel Testing
 * Creates a test user to verify ellipsis menu functionality
 */

require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createTestUser() {
  console.log('\ud83e\uddea Creating Test User for Admin Panel...\\n');

  try {
    // Connect to MongoDB
    console.log('1\ufe0f\u20e3 Connecting to MongoDB...');
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoUri);
    console.log('\u2705 MongoDB connected successfully\\n');

    // Test user details
    const testEmail = 'testuser@example.com';
    const firstName = 'Test';
    const lastName = 'User';

    console.log('2\ufe0f\u20e3 Checking if test user exists...');
    const existingUser = await User.findOne({ email: testEmail });
    
    if (existingUser) {
      console.log('\u26a0\ufe0f Test user already exists, updating...');
      existingUser.profile.name = `${firstName} ${lastName}`;
      existingUser.profile.firstName = firstName;
      existingUser.profile.lastName = lastName;
      existingUser.profile.profileCompleteness = 75;
      existingUser.status = 'active';
      existingUser.isApprovedByAdmin = true;
      existingUser.role = 'user';
      await existingUser.save();
      console.log('\u2705 Test user updated successfully');
    } else {
      console.log('3\ufe0f\u20e3 Creating new test user...');
      
      // Generate UUID for the new user
      const { v4: uuidv4 } = require('uuid');
      const userUuid = uuidv4();

      // Create test user
      const testUser = new User({
        email: testEmail,
        userUuid,
        role: 'user', // Important: role must be 'user' to show ellipsis
        status: 'active',
        isFirstLogin: false,
        isApprovedByAdmin: true,
        profile: {
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          profileCompleteness: 75
        },
        preferences: {
          ageRange: { min: 18, max: 50 },
          education: [],
          location: [],
          profession: []
        },
        verification: {
          approvalType: 'admin',
          isVerified: true,
          verifiedAt: new Date()
        },
        profileCompleted: false,
        loginHistory: []
      });

      await testUser.save();
      console.log('\u2705 Test user created successfully');
    }

    // Verify user was created/updated
    const user = await User.findOne({ email: testEmail });
    console.log('\n4\ufe0f\u20e3 User Details:');
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Status: ${user.status}`);
    console.log(`   - Approved by Admin: ${user.isApprovedByAdmin}`);
    console.log(`   - Profile Name: ${user.profile?.name}`);
    console.log(`   - Profile Completeness: ${user.profile?.profileCompleteness}%`);

    console.log('\n\ud83c\udf89 Test user ready for admin panel testing!');
    console.log('   - Visit: http://localhost:3000/admin/users');
    console.log('   - Look for the ellipsis menu (three dots) in the Actions column');

  } catch (error) {
    console.error('\u274c Failed to create test user:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  console.log('\ud83d\ude80 Create Test User for Admin Panel\\n');
  await createTestUser();
}

if (require.main === module) {
  main().catch(console.error);
} 
