#!/usr/bin/env node
const mongoose = require('mongoose');
const { User } = require('../src/models');

async function createTestUser() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const testEmail = 'test@example.com';
    
    // Check if user already exists
    let user = await User.findOne({ email: testEmail });
    
    if (user) {
      console.log('✅ Test user already exists:', testEmail);
      console.log('   - Role:', user.role);
      console.log('   - Approved:', user.isApprovedByAdmin);
      console.log('   - Profile Completeness:', user.profile?.profileCompleteness || 0);
    } else {
      // Create new test user
      user = new User({
        email: testEmail,
        phoneNumber: '+919354799303',
        firebaseUid: 'mock_firebase_uid_test_user',
        role: 'user',
        isApprovedByAdmin: true,
        status: 'active',
        verified: true,
        isFirstLogin: false,
        profileCompleted: true,
        profile: {
          name: 'Test User',
          age: 25,
          gender: 'Female',
          profession: 'Software Engineer',
          education: 'Bachelor\'s Degree',
          currentResidence: 'Mumbai, Maharashtra',
          nativePlace: 'Delhi, Delhi',
          about: 'Test user for development purposes',
          interests: ['technology', 'travel'],
          profileCompleteness: 100
        }
      });
      
      await user.save();
      console.log('✅ Test user created:', testEmail);
    }
    
    // Create an admin user too
    const adminEmail = 'admin@test.com';
    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      admin = new User({
        email: adminEmail,
        phoneNumber: '+919999999999',
        firebaseUid: 'mock_firebase_uid_admin_user',
        role: 'admin',
        isApprovedByAdmin: true,
        status: 'active',
        verified: true,
        isFirstLogin: false,
        profileCompleted: true,
        profile: {
          name: 'Admin User',
          profileCompleteness: 100
        }
      });
      
      await admin.save();
      console.log('✅ Admin user created:', adminEmail);
    } else {
      console.log('✅ Admin user already exists:', adminEmail);
    }
    
    console.log('\n📧 Test credentials:');
    console.log('User: test@example.com');
    console.log('Admin: admin@test.com');
    console.log('\n🧪 You can now test authentication with these emails!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

createTestUser();