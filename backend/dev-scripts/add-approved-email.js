// Enhanced script to add approved email to MongoDB and handle new users
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

// Fallback to .env if environment-specific file doesn't exist
require('dotenv').config();

// Import the models
const { Preapproved, User } = require('../src/models');

async function addApprovedEmail(email) {
  try {
    // Use the same MongoDB URI logic as the main application
    const environment = process.env.NODE_ENV || 'development';
  const DEV_MONGODB_URI = process.env.DEV_MONGODB_URI || '';

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
    
    if (!mongoUri) {
      console.error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment or .env.development');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const normalizedEmail = email.toLowerCase();

    // Check if email already exists in approved list
    const existingApprovedEmail = await Preapproved.findOne({ email: normalizedEmail });
    if (existingApprovedEmail) {
      console.log(`\u26a0\ufe0f  Email ${email} is already in approved list`);
    } else {
      // Create new preapproved email
      const newApprovedEmail = new Preapproved({
        email: normalizedEmail,
        uuid: uuidv4(),
        addedAt: new Date()
      });

      await newApprovedEmail.save();
      console.log(`\u2705 Email ${email} has been added to approved list`);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log(`\u2139\ufe0f  User ${email} already exists in database`);
      
      // Fix profileCompleteness if it exceeds 100
      if (existingUser.profile.profileCompleteness > 100) {
        existingUser.profile.profileCompleteness = Math.min(existingUser.profile.profileCompleteness, 100);
        await existingUser.save();
        console.log(`\u2705 Fixed profileCompleteness for existing user ${email}`);
      }
    } else {
      console.log(`\u2139\ufe0f  User ${email} will be created when they first verify OTP`);
      console.log(`\ud83d\udcdd New users will have profileCompleteness: 17 (basic profile setup)`);
    }

  } catch (error) {
    console.error('\u274c Error adding approved email:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('\u274c Please provide an email address as an argument');
  console.log('Usage: node add-approved-email.js <email>');
  process.exit(1);
}

// Run the function
addApprovedEmail(email); 
