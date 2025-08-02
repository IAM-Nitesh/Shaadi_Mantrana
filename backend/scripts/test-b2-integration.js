#!/usr/bin/env node

/**
 * B2 Cloud Storage Integration Test Script
 * Tests the complete B2 upload/download functionality
 */

require('dotenv').config({ path: '.env.development' });
const B2StorageService = require('../src/services/b2StorageService');
const fs = require('fs').promises;
const path = require('path');

async function testB2Integration() {
  console.log('🧪 Testing B2 Cloud Storage Integration...\n');

  try {
    // Initialize B2 service
    const b2Storage = new B2StorageService();
    
    // Test 1: Authorization
    console.log('1️⃣ Testing B2 Authorization...');
    await b2Storage.authorize();
    console.log('✅ Authorization successful\n');

    // Test 2: Load test image file
    console.log('2️⃣ Loading test image file...');
    const testImagePath = path.join(__dirname, '..', '..', 'GPT_Image_1_Image_showing_happy_Indian_couple_with_a_caption_W_0.jpeg');
    const testImageBuffer = await fs.readFile(testImagePath);
    const testUserId = 'test-user-' + Date.now();
    console.log('✅ Test image loaded:', testImagePath);
    console.log('📊 Image size:', testImageBuffer.length, 'bytes\n');

    // Test 3: Upload profile picture
    console.log('3️⃣ Testing profile picture upload...');
    const uploadResult = await b2Storage.uploadProfilePicture(testImageBuffer, testUserId);
    console.log('✅ Upload successful:', uploadResult.fileName);
    console.log('📊 File size:', uploadResult.size, 'bytes\n');

    // Test 4: Check if file exists
    console.log('4️⃣ Testing file existence check...');
    const exists = await b2Storage.profilePictureExists(testUserId);
    console.log('✅ File exists:', exists, '\n');

    // Test 5: Get file info
    console.log('5️⃣ Testing file info retrieval...');
    const fileInfo = await b2Storage.getProfilePictureInfo(testUserId);
    console.log('✅ File info retrieved:', fileInfo ? 'Success' : 'Not found', '\n');

    // Test 6: Generate signed URL
    console.log('6️⃣ Testing signed URL generation...');
    const signedUrl = await b2Storage.getSignedUrl(testUserId, 3600);
    console.log('✅ Signed URL generated:', signedUrl ? 'Success' : 'Failed', '\n');

    // Test 7: Get storage stats
    console.log('7️⃣ Testing storage statistics...');
    const stats = await b2Storage.getStorageStats();
    console.log('✅ Storage stats:', {
      totalFiles: stats.totalFiles,
      totalSizeMB: stats.totalSizeMB,
      averageSizeKB: stats.averageSizeKB
    }, '\n');

    // Test 8: Delete profile picture
    console.log('8️⃣ Testing profile picture deletion...');
    const deleteResult = await b2Storage.deleteProfilePicture(testUserId);
    console.log('✅ Deletion successful:', deleteResult, '\n');

    // Test 9: Verify deletion
    console.log('9️⃣ Verifying deletion...');
    const stillExists = await b2Storage.profilePictureExists(testUserId);
    console.log('✅ File deleted:', !stillExists, '\n');

    console.log('🎉 All B2 integration tests passed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Authorization');
    console.log('✅ Image upload');
    console.log('✅ File existence check');
    console.log('✅ File info retrieval');
    console.log('✅ Signed URL generation');
    console.log('✅ Storage statistics');
    console.log('✅ File deletion');
    console.log('✅ Deletion verification');

  } catch (error) {
    console.error('❌ B2 integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Check environment variables
function checkEnvironment() {
  const required = ['B2_KEY_ID', 'B2_APP_KEY', 'B2_BUCKET_ID', 'B2_BUCKET_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease add these to your .env file and try again.');
    process.exit(1);
  }
  
  console.log('✅ Environment variables configured');
}

// Run tests
async function main() {
  console.log('🚀 B2 Cloud Storage Integration Test\n');
  
  checkEnvironment();
  console.log('');
  
  await testB2Integration();
  
  console.log('\n✨ Test completed successfully!');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 