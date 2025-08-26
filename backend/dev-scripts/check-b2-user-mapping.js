#!/usr/bin/env node

/**
 * B2 User Mapping Check Script
 * Checks if B2 profile pictures belong to existing users
 */

require('dotenv').config({ path: '.env.development' });
const B2StorageService = require('../src/services/b2StorageService');
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function checkB2UserMapping() {
  console.log('\ud83e\uddea Checking B2 User Mapping...\\n');

  try {
    // Connect to MongoDB
    console.log('1\ufe0f\u20e3 Connecting to MongoDB...');
      const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
      if (!mongoUri) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');
    await mongoose.connect(mongoUri);
    console.log('\u2705 MongoDB connected successfully\\n');

    // Get all users
    console.log('2\ufe0f\u20e3 Fetching all users...');
    const allUsers = await User.find({});
    console.log('\u2705 Total users in database:', allUsers.length);
    
    // Get admin user
    const adminUser = allUsers.find(user => user.role === 'admin');
    console.log('   - Admin user:', adminUser ? adminUser.email : 'None');
    console.log('   - Admin user ID:', adminUser ? adminUser._id : 'None');
    console.log('\\n');

    // Initialize B2 service
    console.log('3\ufe0f\u20e3 Connecting to B2...');
    const b2Storage = new B2StorageService();
    await b2Storage.authorize();
    console.log('\u2705 B2 connected successfully\\n');

    // Get all profile pictures from B2
    console.log('4\ufe0f\u20e3 Fetching B2 profile pictures...');
    const { data: files } = await b2Storage.b2.listFileNames({
      bucketId: b2Storage.bucketId,
      prefix: 'profile_pictures/'
    });
    console.log('\u2705 Total profile pictures in B2:', files.files.length);
    console.log('\\n');

    // Check each profile picture
    console.log('5\ufe0f\u20e3 Checking profile picture ownership:');
    for (const file of files.files) {
      const userId = file.fileName.replace('profile_pictures/', '').replace('.jpg', '');
      console.log(`   - File: ${file.fileName}`);
      console.log(`   - User ID: ${userId}`);
      console.log(`   - Size: ${formatBytes(file.contentLength)}`);
      
      // Check if user exists in database
      const user = allUsers.find(u => u._id.toString() === userId);
      if (user) {
        console.log(`   - \u2705 User found: ${user.email} (${user.role})`);
      } else {
        console.log(`   - \u274c User not found in database (orphaned file)`);
      }
      console.log('');
    }

    // Check if admin has profile picture
    if (adminUser) {
      console.log('6\ufe0f\u20e3 Checking admin profile picture:');
      const adminProfileExists = await b2Storage.profilePictureExists(adminUser._id.toString());
      console.log(`   - Admin profile picture exists: ${adminProfileExists}`);
      
      if (adminProfileExists) {
        const adminProfileInfo = await b2Storage.getProfilePictureInfo(adminUser._id.toString());
        console.log(`   - Admin profile info:`, adminProfileInfo);
      }
      console.log('\\n');
    }

    console.log('\ud83c\udf89 B2 user mapping check completed!');

  } catch (error) {
    console.error('\u274c B2 user mapping check failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  console.log('\ud83d\ude80 B2 User Mapping Check\\n');
  await checkB2UserMapping();
}

if (require.main === module) {
  main().catch(console.error);
} 
