/**
 * Test Upload New Format Script
 * Tests uploading a new image with userId-based filename format
 */

// Load environment variables from .env.development
require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection (using same URI as main app)
const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';

async function testUploadNewFormat() {
  try {
    console.log('🔄 Testing upload with new userId-based format...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Import User model and B2StorageService
    const User = require('../src/models/User');
    const B2StorageService = require('../src/services/b2StorageService');
    
    // Find the specific user
    const user = await User.findOne({
      email: 'niteshkumar9591@gmail.com'
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`🔍 Testing for user: ${user._id}`);
    console.log(`📋 User email: ${user.email}`);
    
    // Initialize B2 storage service
    const b2Storage = new B2StorageService();
    
    // Create a test image buffer (small test image)
    const testImageBuffer = Buffer.from('fake-image-data-for-testing');
    
    // Upload with new userId-based filename
    console.log('🔄 Uploading test image with new format...');
    const uploadResult = await b2Storage.uploadProfilePicture(testImageBuffer, user._id);
    console.log(`✅ Uploaded with new format: ${uploadResult.fileName}`);
    console.log(`📋 File URL: ${uploadResult.url}`);
    
    // Test profile picture existence
    console.log('🔄 Testing profile picture existence...');
    const exists = await b2Storage.profilePictureExists(user._id);
    console.log(`📋 Profile picture exists: ${exists}`);
    
    if (exists) {
      // Test signed URL generation
      console.log('🔄 Testing signed URL generation...');
      const signedUrl = await b2Storage.getSignedUrl(user._id);
      console.log(`✅ Signed URL generated: ${signedUrl}`);
      
      // Update user document with new URL
      await User.findByIdAndUpdate(user._id, {
        $set: {
          'profile.images': uploadResult.url
        }
      });
      
      console.log(`✅ Updated user ${user._id} with new image URL`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testUploadNewFormat(); 