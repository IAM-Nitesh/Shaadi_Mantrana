// Database migration script to clean up empty string enum values
const mongoose = require('mongoose');

// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

// Fallback to .env if environment-specific file doesn't exist
require('dotenv').config();

// Import the User model
const { User } = require('../src/models');

async function cleanupEnumFields() {
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
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find users with empty string enum values
    const enumFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad'];
    
    let totalUpdated = 0;
    
    for (const field of enumFields) {
      const query = { [`profile.${field}`]: '' };
      const update = { $unset: { [`profile.${field}`]: 1 } };
      
      const result = await User.updateMany(query, update);
      if (result.modifiedCount > 0) {
        console.log(`✅ Cleaned up ${result.modifiedCount} users with empty '${field}' field`);
        totalUpdated += result.modifiedCount;
      }
    }
    
    if (totalUpdated === 0) {
      console.log('✅ No users found with empty enum values');
    } else {
      console.log(`✅ Total users updated: ${totalUpdated}`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupEnumFields();
}

module.exports = { cleanupEnumFields }; 
/* The `// Database migration script to clean up empty string enum values` is a JavaScript script that
connects to a MongoDB database, specifically targeting the User model. It aims to clean up any empty
string values in specific enum fields within the User profiles. */
/* The `// Database migration script to clean up empty string enum values` is a JavaScript script that
connects to a MongoDB database, specifically targeting the User model. It aims to clean up any empty
string values in specific enum fields within the User profiles. */
/* The `// Database migration script to clean up empty string enum values` is a JavaScript script that
connects to a MongoDB database and specifically targets the User model. Its purpose is to clean up
any empty string values in specific enum fields within the User profiles. */
/* The `// Database migration script to clean up empty string enum values` is a JavaScript script that
connects to a MongoDB database and specifically targets the User model. Its purpose is to clean up
any empty string values in specific enum fields within the User profiles. */
// Database migration script to clean up empty string enum values
const mongoose = require('mongoose');

// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

// Fallback to .env if environment-specific file doesn't exist
require('dotenv').config();

// Import the User model
const { User } = require('../src/models');

async function cleanupEnumFields() {
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
    console.log('✅ Connected to MongoDB');

    // Find users with empty string enum values
    const enumFields = ['gender', 'maritalStatus', 'manglik', 'complexion', 'eatingHabit', 'smokingHabit', 'drinkingHabit', 'settleAbroad'];
    
    let totalUpdated = 0;
    
    for (const field of enumFields) {
      const query = { [`profile.${field}`]: '' };
      const update = { $unset: { [`profile.${field}`]: 1 } };
      
      const result = await User.updateMany(query, update);
      if (result.modifiedCount > 0) {
        console.log(`✅ Cleaned up ${result.modifiedCount} users with empty '${field}' field`);
        totalUpdated += result.modifiedCount;
      }
    }
    
    if (totalUpdated === 0) {
      console.log('✅ No users found with empty enum values');
    } else {
      console.log(`✅ Total users updated: ${totalUpdated}`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupEnumFields();
}

module.exports = { cleanupEnumFields };
