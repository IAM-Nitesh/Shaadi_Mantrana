#!/usr/bin/env node

/**
 * MongoDB Stats Test Script
 * Tests MongoDB connection and checks actual data
 */

require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function testMongoStats() {
  console.log('🧪 Testing MongoDB Statistics...\n');

  try {
    // Connect to MongoDB
    console.log('1️⃣ Connecting to MongoDB...');
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully\n');

    // Test 2: Get all users
    console.log('2️⃣ Fetching all users...');
    const allUsers = await User.find({});
    console.log('✅ Total users in database:', allUsers.length);
    
    // Filter admin users
    const adminUsers = allUsers.filter(user => user.role === 'admin');
    const regularUsers = allUsers.filter(user => user.role !== 'admin');
    
    console.log('   - Admin users:', adminUsers.length);
    console.log('   - Regular users:', regularUsers.length);
    console.log('\n');

    // Test 3: Get user details
    console.log('3️⃣ User details:');
    regularUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - Status: ${user.status}`);
      console.log(`      Profile: ${user.profile?.name || 'No Name'}`);
      console.log(`      Completeness: ${user.profile?.profileCompleteness || 0}%`);
      console.log(`      Created: ${user.createdAt}`);
      console.log(`      Last Active: ${user.lastActive}`);
      console.log('');
    });

    // Test 4: Calculate storage size
    console.log('4️⃣ Calculating storage size...');
    let totalSize = 0;
    regularUsers.forEach(user => {
      const userData = {
        _id: user._id,
        email: user.email,
        userUuid: user.userUuid,
        role: user.role,
        status: user.status,
        isFirstLogin: user.isFirstLogin,
        profile: user.profile,
        preferences: user.preferences,
        verification: user.verification,
        premium: user.premium,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
        lastActive: user.lastActive,
        updatedAt: user.updatedAt,
        loginHistory: user.loginHistory
      };
      totalSize += JSON.stringify(userData).length;
    });
    
    console.log('   - Total storage size:', formatBytes(totalSize));
    console.log('   - Profiles with images:', regularUsers.filter(u => u.profile?.images && u.profile.images.length > 0).length);
    console.log('   - Profiles without images:', regularUsers.filter(u => !u.profile?.images || u.profile.images.length === 0).length);
    console.log('\n');

    // Test 5: Get recent activity
    console.log('5️⃣ Recent activity:');
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent24h = regularUsers.filter(user => new Date(user.createdAt) >= last24Hours).length;
    const recent7d = regularUsers.filter(user => new Date(user.createdAt) >= last7Days).length;
    const recent30d = regularUsers.filter(user => new Date(user.createdAt) >= last30Days).length;

    console.log('   - Last 24 hours:', recent24h);
    console.log('   - Last 7 days:', recent7d);
    console.log('   - Last 30 days:', recent30d);
    console.log('\n');

    console.log('🎉 MongoDB stats test completed successfully!');

  } catch (error) {
    console.error('❌ MongoDB stats test failed:', error.message);
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
  console.log('🚀 MongoDB Stats Test\n');
  await testMongoStats();
}

if (require.main === module) {
  main().catch(console.error);
} 