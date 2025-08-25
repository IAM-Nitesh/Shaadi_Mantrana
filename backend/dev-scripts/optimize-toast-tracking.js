const mongoose = require('mongoose');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

// Import the models
const DailyLike = require('../src/models/DailyLike_Optimized');
const Connection = require('../src/models/Connection');

async function optimizeToastTracking() {
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

    // Find all mutual matches
    const mutualMatches = await DailyLike.find({
      isMutualMatch: true
    });

    console.log(`📊 Found ${mutualMatches.length} mutual matches to optimize`);

    if (mutualMatches.length === 0) {
      console.log('ℹ️ No mutual matches found for optimization');
      return;
    }

    // Group matches by user pairs to find connections
    const userPairs = new Map();
    
    mutualMatches.forEach(match => {
      const user1 = match.userId.toString();
      const user2 = match.likedProfileId.toString();
      const pairKey = [user1, user2].sort().join('-');
      
      if (!userPairs.has(pairKey)) {
        userPairs.set(pairKey, []);
      }
      userPairs.get(pairKey).push(match);
    });

    console.log(`📊 Found ${userPairs.size} unique user pairs`);

    let updatedCount = 0;
    let connectionAddedCount = 0;

    // Process each user pair
    for (const [pairKey, matches] of userPairs) {
      try {
        const [user1, user2] = pairKey.split('-');
        
        // Find the connection for this user pair
        const connection = await Connection.findOne({
          users: { $all: [user1, user2] },
          status: 'accepted'
        });

        if (connection) {
          console.log(`🔗 Found connection ${connection._id} for users ${user1} and ${user2}`);
          
          // Update all matches for this pair with the connectionId
          for (const match of matches) {
            await DailyLike.updateOne(
              { _id: match._id },
              { 
                $set: { connectionId: connection._id },
                $unset: { toastSeen: 1 } // Remove redundant toastSeen data
              }
            );
            updatedCount++;
          }
          
          // Add toastSeen to the first match only (optimized storage)
          if (matches.length > 0) {
            await DailyLike.updateOne(
              { _id: matches[0]._id },
              { 
                $set: { 
                  connectionId: connection._id,
                  toastSeen: {
                    userA: false,
                    userB: false
                  }
                }
              }
            );
            connectionAddedCount++;
          }
        } else {
          console.log(`⚠️ No connection found for users ${user1} and ${user2}`);
        }
      } catch (error) {
        console.error(`❌ Error processing pair ${pairKey}:`, error);
      }
    }

    console.log(`🎉 Successfully optimized ${updatedCount} matches`);
    console.log(`🎉 Added connectionId to ${connectionAddedCount} primary matches`);
    console.log(`🎉 Removed redundant toastSeen data from ${updatedCount - connectionAddedCount} secondary matches`);

    // Verify the optimization
    const optimizedMatches = await DailyLike.find({
      isMutualMatch: true,
      connectionId: { $exists: true }
    });

    console.log(`📊 Verified: ${optimizedMatches.length} matches now have connectionId`);

  } catch (error) {
    console.error('❌ Optimization failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the optimization
optimizeToastTracking()
  .then(() => {
    console.log('🎉 Toast tracking optimization completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  }); 