const mongoose = require('mongoose');
const path = require('path');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

// Import the DailyLike model
const DailyLike = require('../src/models/DailyLike_Optimized');
const User = require('../src/models/User');

async function testToastTracking() {
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
    }).populate('userId', 'profile.name').populate('likedProfileId', 'profile.name');

    console.log(`📊 Found ${mutualMatches.length} mutual matches`);

    if (mutualMatches.length === 0) {
      console.log('ℹ️ No mutual matches found for testing');
      return;
    }

    // Display toast tracking status for each match
    mutualMatches.forEach((match, index) => {
      console.log(`\n🔍 Match ${index + 1}:`);
      console.log(`   User A: ${match.userId?.profile?.name || 'Unknown'} (${match.userId})`);
      console.log(`   User B: ${match.likedProfileId?.profile?.name || 'Unknown'} (${match.likedProfileId})`);
      console.log(`   Toast Seen - User A: ${match.toastSeen?.userA || false}`);
      console.log(`   Toast Seen - User B: ${match.toastSeen?.userB || false}`);
      console.log(`   Match Date: ${match.likeDate}`);
    });

    // Test the toast tracking logic
    console.log('\n🧪 Testing Toast Tracking Logic:');
    
    mutualMatches.forEach((match, index) => {
      const userA = match.userId;
      const userB = match.likedProfileId;
      
      // Simulate what would happen if userA likes userB
      const isUserA = true; // Simulating userA's perspective
      const shouldShowToast = isUserA ? !match.toastSeen?.userA : !match.toastSeen?.userB;
      
      console.log(`\n   Match ${index + 1} - User A perspective:`);
      console.log(`   Should show toast: ${shouldShowToast}`);
      
      if (shouldShowToast) {
        console.log(`   ✅ Toast would be shown to ${userA?.profile?.name || 'User A'}`);
        console.log(`   📝 Toast would be marked as seen for ${userA?.profile?.name || 'User A'}`);
      } else {
        console.log(`   ❌ Toast would NOT be shown to ${userA?.profile?.name || 'User A'} (already seen)`);
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testToastTracking()
  .then(() => {
    console.log('\n🎉 Toast tracking test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 