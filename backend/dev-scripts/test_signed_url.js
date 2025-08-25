/**
 * Test Signed URL Generation Script
 * Tests the signed URL generation for a specific user
 */

// Load environment variables from .env.development
require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');

// MongoDB connection (using same URI as main app)
const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';

async function testSignedUrl() {
  try {
    console.log('🔄 Testing signed URL generation...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Import User model and B2StorageService
    const User = require('../src/models/User');
    const B2StorageService = require('../src/services/b2StorageService');
    
    // Find the specific user with the profile picture
    const user = await User.findOne({
      email: 'niteshkumar9591@gmail.com'
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`🔍 Testing for user: ${user._id}`);
    console.log(`📋 User email: ${user.email}`);
    console.log(`📋 Profile image URL: ${user.profile.images}`);
    console.log(`📋 Profile picture UUID: ${user.profilePictureUuid}`);
    
    // Initialize B2 storage service
    const b2Storage = new B2StorageService();
    
    // Test profile picture existence
    console.log('🔄 Testing profile picture existence...');
    const exists = await b2Storage.profilePictureExists(user._id);
    console.log(`📋 Profile picture exists: ${exists}`);
    
    if (exists) {
      // Test signed URL generation
      console.log('🔄 Testing signed URL generation...');
      const signedUrl = await b2Storage.getSignedUrl(user._id);
      console.log(`✅ Signed URL generated: ${signedUrl}`);
      
      // Test if the URL is accessible
      console.log('🔄 Testing URL accessibility...');
      try {
        const response = await fetch(signedUrl, { method: 'HEAD' });
        console.log(`📋 URL response status: ${response.status}`);
        if (response.ok) {
          console.log('✅ Signed URL is accessible!');
        } else {
          console.log('❌ Signed URL is not accessible');
        }
      } catch (error) {
        console.log('❌ Error testing URL accessibility:', error.message);
      }
    } else {
      console.log('❌ Profile picture does not exist in B2');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testSignedUrl(); 