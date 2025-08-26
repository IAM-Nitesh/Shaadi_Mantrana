/**
 * Check User Document Script
 * Checks the current state of a user document
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection (using same URI as main app)
const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
if (!mongoUri) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');

async function checkUser() {
  try {
    console.log('🔄 Checking user document...');

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Import User model
    const User = require('../src/models/User');
    
    // Find the specific user
    const user = await User.findOne({
      email: 'niteshkumar9591@gmail.com'
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`🔍 User details:`);
    console.log(`  - ID: ${user._id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Profile images: ${user.profile.images}`);
    console.log(`  - Profile picture UUID: ${user.profilePictureUuid}`);
    console.log(`  - Has profilePictureUuid field: ${user.hasOwnProperty('profilePictureUuid')}`);
    
    // Check all fields in the user document
    console.log(`📋 All user fields:`);
    console.log(JSON.stringify(user.toObject(), null, 2));
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the check
checkUser();