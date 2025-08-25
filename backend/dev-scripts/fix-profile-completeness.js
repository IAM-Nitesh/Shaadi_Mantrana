// Script to fix profileCompleteness values that exceed 100
const mongoose = require('mongoose');

// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

// Fallback to .env if environment-specific file doesn't exist
require('dotenv').config();

// Import the User model
const { User } = require('../src/models');

async function fixProfileCompleteness() {
  try {
    // Use the same MongoDB URI logic as the main application
    const environment = process.env.NODE_ENV || 'development';
    const DEV_MONGODB_URI = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    let mongoUri;
    switch (environment) {
      case 'development':
      case 'dev':
      case 'local':
        mongoUri = process.env.MONGODB_URI || DEV_MONGODB_URI;
        break;
      case 'production':
      case 'prod':
        mongoUri = process.env.MONGODB_URI || process.env.MONGODB_PRODUCTION_URI;
        break;
      case 'test':
        mongoUri = process.env.MONGODB_TEST_URI || DEV_MONGODB_URI;
        break;
      default:
        mongoUri = DEV_MONGODB_URI;
    }
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    // Find users with profileCompleteness > 100
    const usersWithHighCompleteness = await User.find({
      'profile.profileCompleteness': { $gt: 100 }
    });

    console.log(`\ud83d\udcca Found ${usersWithHighCompleteness.length} users with profileCompleteness > 100`);

    if (usersWithHighCompleteness.length === 0) {
      console.log('\u2705 No users need fixing');
      return;
    }

    // Fix each user
    let fixedCount = 0;
    for (const user of usersWithHighCompleteness) {
      const oldValue = user.profile.profileCompleteness;
      user.profile.profileCompleteness = Math.min(oldValue, 100);
      await user.save();
      console.log(`\u2705 Fixed user ${user.email}: ${oldValue} \u2192 ${user.profile.profileCompleteness}`);
      fixedCount++;
    }

    console.log(`\u2705 Successfully fixed ${fixedCount} users`);

  } catch (error) {
    console.error('\u274c Error fixing profile completeness:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

// Run the fix
fixProfileCompleteness(); 
