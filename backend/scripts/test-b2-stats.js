#!/usr/bin/env node

/**
 * B2 Storage Stats Test Script
 * Tests B2 storage statistics retrieval
 */

require('dotenv').config({ path: '.env.development' });
const B2StorageService = require('../src/services/b2StorageService');

async function testB2Stats() {
  console.log('🧪 Testing B2 Storage Statistics...\n');

  try {
    // Initialize B2 service
    const b2Storage = new B2StorageService();
    
    // Test 1: Authorization
    console.log('1️⃣ Testing B2 Authorization...');
    await b2Storage.authorize();
    console.log('✅ Authorization successful\n');

    // Test 2: Get storage stats
    console.log('2️⃣ Testing storage statistics...');
    const stats = await b2Storage.getStorageStats();
    console.log('✅ Storage stats retrieved:');
    console.log('   - Total Files:', stats.totalFiles);
    console.log('   - Total Size (Bytes):', stats.totalSizeBytes);
    console.log('   - Total Size (MB):', stats.totalSizeMB);
    console.log('   - Average Size (Bytes):', stats.averageSizeBytes);
    console.log('   - Average Size (KB):', stats.averageSizeKB);
    console.log('   - Formatted Total Size:', formatBytes(stats.totalSizeBytes));
    console.log('\n');

    // Test 3: List files in bucket
    console.log('3️⃣ Testing file listing...');
    const { data: files } = await b2Storage.b2.listFileNames({
      bucketId: b2Storage.bucketId,
      prefix: 'profile_pictures/'
    });
    console.log('✅ Files in bucket:');
    files.files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.fileName} (${formatBytes(file.contentLength)})`);
    });
    console.log('\n');

    console.log('🎉 B2 storage stats test completed successfully!');

  } catch (error) {
    console.error('❌ B2 storage stats test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
  
  console.log('✅ Environment variables configured\n');
}

async function main() {
  console.log('🚀 B2 Storage Stats Test\n');
  
  checkEnvironment();
  await testB2Stats();
}

if (require.main === module) {
  main().catch(console.error);
} 