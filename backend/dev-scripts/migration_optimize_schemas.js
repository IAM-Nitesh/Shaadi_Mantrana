#!/usr/bin/env node

/**
 * MongoDB Schema Optimization Migration Scripts
 * 
 * This script contains migration functions to optimize the MongoDB schemas
 * by removing data duplication and implementing TTL indexes.
 */

const mongoose = require('mongoose');
const config = require('../src/config');

// Import all models to ensure they are registered
require('../src/models/User');
require('../src/models/Connection');
require('../src/models/Invitation');
require('../src/models/DailyLike');
require('../src/models/Match');
require('../src/models/PreapprovedEmail');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(config.DATABASE.URI);
    console.log('\u2705 Connected to MongoDB');
  } catch (error) {
    console.error('\u274c Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Migration 1: Replace loginHistory with lastLogin in User schema
async function migrateLoginHistory() {
  console.log('\\n\ud83d\udd04 Starting loginHistory migration...');
  
  try {
    const User = mongoose.model('User');
    
    // Find all users with loginHistory
    const usersWithHistory = await User.find({ loginHistory: { $exists: true, $ne: [] } });
    console.log(`\\ud83d\\udcca Found ${usersWithHistory.length} users with login history`);
    
    let migratedCount = 0;
    
    for (const user of usersWithHistory) {
      if (user.loginHistory && user.loginHistory.length > 0) {
        // Get the most recent login entry
        const lastLoginEntry = user.loginHistory[user.loginHistory.length - 1];
        
        // Update user with lastLogin and remove loginHistory
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              lastLogin: {
                timestamp: lastLoginEntry.timestamp || new Date(),
                ipAddress: lastLoginEntry.ipAddress || '',
                userAgent: lastLoginEntry.userAgent || '',
                deviceType: 'desktop' // Default value
              }
            },
            $unset: { loginHistory: "" }
          }
        );
        
        migratedCount++;
      }
    }
    
    console.log(`\u2705 Successfully migrated ${migratedCount} users`);
    return migratedCount;
  } catch (error) {
    console.error('\u274c Error during loginHistory migration:', error);
    throw error;
  }
}

// Migration 2: Remove legacy fields from User schema
async function removeLegacyFields() {
  console.log('\\n\ud83d\udd04 Starting legacy fields removal...');
  
  try {
    const User = mongoose.model('User');
    
    // Remove legacy fields: age, profession, location
    const result = await User.updateMany(
      {},
      { $unset: { age: "", profession: "", location: "" } }
    );
    
    console.log(`\u2705 Removed legacy fields from ${result.modifiedCount} users`);
    return result.modifiedCount;
  } catch (error) {
    console.error('\u274c Error during legacy fields removal:', error);
    throw error;
  }
}

// Migration 3: Optimize preferences structure in User schema
async function optimizePreferences() {
  console.log('\\n\ud83d\udd04 Starting preferences optimization...');
  
  try {
    const User = mongoose.model('User');
    
    // Find users with old preferences structure
    const usersWithOldPreferences = await User.find({
      'preferences.location': { $exists: true }
    });
    
    console.log(`\\ud83d\\udcca Found ${usersWithOldPreferences.length} users with old preferences structure`);
    
    let optimizedCount = 0;
    
    for (const user of usersWithOldPreferences) {
      if (user.preferences && user.preferences.location) {
        // Convert old preferences structure to new structure
        const newPreferences = {
          ageRange: user.preferences.ageRange || { min: 18, max: 50 },
          locations: Array.isArray(user.preferences.location) ? user.preferences.location : [],
          professions: Array.isArray(user.preferences.profession) ? user.preferences.profession : [],
          education: Array.isArray(user.preferences.education) ? user.preferences.education : []
        };
        
        // Update user with new preferences structure
        await User.updateOne(
          { _id: user._id },
          { $set: { preferences: newPreferences } }
        );
        
        optimizedCount++;
      }
    }
    
    console.log(`\u2705 Successfully optimized preferences for ${optimizedCount} users`);
    return optimizedCount;
  } catch (error) {
    console.error('\u274c Error during preferences optimization:', error);
    throw error;
  }
}

// Migration 4: Replace history with lastStatus in Invitation schema
async function migrateInvitationHistory() {
  console.log('\\n\ud83d\udd04 Starting invitation history migration...');
  
  try {
    const Invitation = mongoose.model('Invitation');
    
    // Find all invitations with history
    const invitationsWithHistory = await Invitation.find({ history: { $exists: true, $ne: [] } });
    console.log(`\\ud83d\\udcca Found ${invitationsWithHistory.length} invitations with history`);
    
    let migratedCount = 0;
    
    for (const invitation of invitationsWithHistory) {
      if (invitation.history && invitation.history.length > 0) {
        // Get the most recent history entry
        const lastHistoryEntry = invitation.history[invitation.history.length - 1];
        
        // Update invitation with lastStatus and remove history
        await Invitation.updateOne(
          { _id: invitation._id },
          {
            $set: {
              lastStatus: {
                sentDate: lastHistoryEntry.sentDate || invitation.sentDate,
                status: lastHistoryEntry.status || invitation.status,
                sentBy: lastHistoryEntry.sentBy || invitation.sentBy
              }
            },
            $unset: { history: "" }
          }
        );
        
        migratedCount++;
      }
    }
    
    console.log(`\u2705 Successfully migrated ${migratedCount} invitations`);
    return migratedCount;
  } catch (error) {
    console.error('\u274c Error during invitation history migration:', error);
    throw error;
  }
}

// Migration 5: Add TTL indexes
async function addTTLIndexes() {
  console.log('\\n\ud83d\udd04 Adding TTL indexes...');
  
  try {
    const db = mongoose.connection.db;
    
    // Add TTL index for expired connections (only if it doesn't exist)
    try {
      await db.collection('connections').createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
      );
      console.log('\u2705 Added TTL index for expired connections');
    } catch (error) {
      if (error.code === 85) {
        console.log('\u2139\ufe0f  TTL index for expired connections already exists');
      } else {
        throw error;
      }
    }
    
    // Add TTL index for old daily likes (90 days)
    try {
      await db.collection('dailylikes').createIndex(
        { likeDate: 1 },
        { expireAfterSeconds: 90 * 24 * 60 * 60 }
      );
      console.log('\u2705 Added TTL index for old daily likes');
    } catch (error) {
      if (error.code === 85) {
        console.log('\u2139\ufe0f  TTL index for old daily likes already exists');
      } else {
        throw error;
      }
    }
    
    // Add TTL index for old invitations (1 year)
    try {
      await db.collection('invitations').createIndex(
        { sentDate: 1 },
        { expireAfterSeconds: 365 * 24 * 60 * 60 }
      );
      console.log('\u2705 Added TTL index for old invitations');
    } catch (error) {
      if (error.code === 85) {
        console.log('\u2139\ufe0f  TTL index for old invitations already exists');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    console.error('\u274c Error adding TTL indexes:', error);
    throw error;
  }
}

// Migration 6: Remove Match schema data (if needed)
async function removeMatchSchema() {
  console.log('\\n\ud83d\udd04 Checking Match schema data...');
  
  try {
    const Match = mongoose.model('Match');
    const Connection = mongoose.model('Connection');
    
    // Count existing matches
    const matchCount = await Match.countDocuments();
    console.log(`\\ud83d\\udcca Found ${matchCount} records in Match collection`);
    
    if (matchCount > 0) {
      console.log('\u26a0\ufe0f  Match schema contains data. Consider migrating to Connection schema first.');
      console.log('\ud83d\udca1 You may want to manually review and migrate this data.');
    } else {
      console.log('\u2705 Match schema is empty, safe to remove');
    }
    
    return matchCount;
  } catch (error) {
    console.error('\u274c Error checking Match schema:', error);
    throw error;
  }
}

// Main migration function
async function runMigrations() {
  console.log('\ud83d\ude80 Starting MongoDB Schema Optimization Migrations...\\n');
  
  try {
    await connectToDatabase();
    
    // Run migrations in order
    await migrateLoginHistory();
    await removeLegacyFields();
    await optimizePreferences();
    await migrateInvitationHistory();
    await addTTLIndexes();
    await removeMatchSchema();
    
    console.log('\\n\ud83c\udf89 All migrations completed successfully!');
    console.log('\\n\ud83d\udccb Migration Summary:');
    console.log('- Login history replaced with lastLogin');
    console.log('- Legacy fields removed from User schema');
    console.log('- Preferences structure optimized');
    console.log('- Invitation history replaced with lastStatus');
    console.log('- TTL indexes added for data cleanup');
    console.log('- Match schema checked for data');
    
  } catch (error) {
    console.error('\\n\u274c Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\\n\ud83d\udc4b Disconnected from MongoDB');
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = {
  migrateLoginHistory,
  removeLegacyFields,
  optimizePreferences,
  migrateInvitationHistory,
  addTTLIndexes,
  removeMatchSchema,
  runMigrations
}; 
