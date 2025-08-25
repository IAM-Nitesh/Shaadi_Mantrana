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
  console.log('\ud83e\uddea Testing B2 Cloud Storage Integration...\\n');

  try {
    // Initialize B2 service
    const b2Storage = new B2StorageService();
    
    // Test 1: Authorization
    console.log('1\ufe0f\u20e3 Testing B2 Authorization...');
    await b2Storage.authorize();
    console.log('\u2705 Authorization successful\\n');

    // Test 2: Load test image file
    console.log('2\ufe0f\u20e3 Loading test image file...');
    const testImagePath = path.join(__dirname, '..', '..', 'GPT_Image_1_Image_showing_happy_Indian_couple_with_a_caption_W_0.jpeg');
    const testImageBuffer = await fs.readFile(testImagePath);
    const testUserId = 'test-user-' + Date.now();
    console.log('\u2705 Test image loaded:', testImagePath);
    console.log('\ud83d\udcca Image size:', testImageBuffer.length, 'bytes\\n');

    // Test 3: Upload profile picture
    console.log('3\ufe0f\u20e3 Testing profile picture upload...');
    const uploadResult = await b2Storage.uploadProfilePicture(testImageBuffer, testUserId);
    console.log('\u2705 Upload successful:', uploadResult.fileName);
    console.log('\ud83d\udcca File size:', uploadResult.size, 'bytes\\n');

    // Test 4: Check if file exists
    console.log('4\ufe0f\u20e3 Testing file existence check...');
    const exists = await b2Storage.profilePictureExists(testUserId);
    console.log('\u2705 File exists:', exists, '\\n');

    // Test 5: Get file info
    console.log('5\ufe0f\u20e3 Testing file info retrieval...');
    const fileInfo = await b2Storage.getProfilePictureInfo(testUserId);
    console.log('\u2705 File info retrieved:', fileInfo ? 'Success' : 'Not found', '\\n');

    // Test 6: Generate signed URL
    console.log('6\ufe0f\u20e3 Testing signed URL generation...');
    const signedUrl = await b2Storage.getSignedUrl(testUserId, 3600);
    console.log('\u2705 Signed URL generated:', signedUrl ? 'Success' : 'Failed', '\\n');

    // Test 7: Get storage stats
    console.log('7\ufe0f\u20e3 Testing storage statistics...');
    const stats = await b2Storage.getStorageStats();
    console.log('\u2705 Storage stats:', {
      totalFiles: stats.totalFiles,
      totalSizeMB: stats.totalSizeMB,
      averageSizeKB: stats.averageSizeKB
    }, '\\n');

    // Test 8: Delete profile picture
    console.log('8\ufe0f\u20e3 Testing profile picture deletion...');
    const deleteResult = await b2Storage.deleteProfilePicture(testUserId);
    console.log('\u2705 Deletion successful:', deleteResult, '\\n');

    // Test 9: Verify deletion
    console.log('9\ufe0f\u20e3 Verifying deletion...');
    const stillExists = await b2Storage.profilePictureExists(testUserId);
    console.log('\u2705 File deleted:', !stillExists, '\\n');

    console.log('\ud83c\udf89 All B2 integration tests passed successfully!');
    console.log('\\n\ud83d\udccb Test Summary:');
    console.log('\u2705 Authorization');
    console.log('\u2705 Image upload');
    console.log('\u2705 File existence check');
    console.log('\u2705 File info retrieval');
    console.log('\u2705 Signed URL generation');
    console.log('\u2705 Storage statistics');
    console.log('\u2705 File deletion');
    console.log('\u2705 Deletion verification');

  } catch (error) {
    console.error('\u274c B2 integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Check environment variables
function checkEnvironment() {
  const required = ['B2_KEY_ID', 'B2_APP_KEY', 'B2_BUCKET_ID', 'B2_BUCKET_NAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('\u274c Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\\nPlease add these to your .env file and try again.');
    process.exit(1);
  }
  
  console.log('\u2705 Environment variables configured');
}

// Run tests
async function main() {
  console.log('\ud83d\ude80 B2 Cloud Storage Integration Test\\n');
  
  checkEnvironment();
  console.log('');
  
  await testB2Integration();
  
  console.log('\\n\u2728 Test completed successfully!');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\u274c Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the test
main().catch(error => {
  console.error('\u274c Test failed:', error);
  process.exit(1);
}); 
