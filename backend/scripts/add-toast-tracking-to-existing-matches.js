const mongoose = require('mongoose');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

// Import the DailyLike model
const DailyLike = require('../src/models/DailyLike_Optimized');

async function addToastTrackingToExistingMatches() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Find all mutual matches that don't have toast tracking
    const mutualMatches = await DailyLike.find({
      isMutualMatch: true,
      $or: [
        { toastSeen: { $exists: false } },
        { toastSeen: null }
      ]
    });

    console.log(`📊 Found ${mutualMatches.length} mutual matches without toast tracking`);

    if (mutualMatches.length === 0) {
      console.log('✅ No mutual matches need updating');
      return;
    }

    // Update each mutual match to add toast tracking
    let updatedCount = 0;
    for (const match of mutualMatches) {
      try {
        // Initialize toast tracking for both users
        const toastSeen = {
          userA: false, // Neither user has seen the toast yet
          userB: false
        };

        await DailyLike.updateOne(
          { _id: match._id },
          { $set: { toastSeen: toastSeen } }
        );

        updatedCount++;
        console.log(`✅ Updated match ${match._id}`);
      } catch (error) {
        console.error(`❌ Failed to update match ${match._id}:`, error);
      }
    }

    console.log(`🎉 Successfully updated ${updatedCount} out of ${mutualMatches.length} mutual matches`);

    // Verify the updates
    const remainingMatches = await DailyLike.find({
      isMutualMatch: true,
      $or: [
        { toastSeen: { $exists: false } },
        { toastSeen: null }
      ]
    });

    console.log(`📊 Remaining matches without toast tracking: ${remainingMatches.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the migration
addToastTrackingToExistingMatches()
  .then(() => {
    console.log('🎉 Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 