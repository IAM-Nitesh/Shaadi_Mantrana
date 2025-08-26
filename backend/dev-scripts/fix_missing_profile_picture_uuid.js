/**
 * Fix Missing Profile Picture UUID Script
 * Extracts UUID from existing image URLs and updates user documents
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection (prefer env-driven values)
const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI || '';

async function fixMissingProfilePictureUuid() {
  try {
    console.log('\ud83d\udd04 Starting fix for missing profilePictureUuid...');
    
    if (!mongoUri) {
      console.error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment or .env.development');
      process.exit(1);
    }

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');
    
    // Import User model
    const User = require('../src/models/User');
    
    // Find users with images but no profilePictureUuid
    const usersWithImages = await User.find({
      'profile.images': { $exists: true, $ne: null, $ne: '' },
      $or: [
        { profilePictureUuid: { $exists: false } },
        { profilePictureUuid: null }
      ]
    });
    
    console.log(`\ud83d\udcca Found ${usersWithImages.length} users with images but no profilePictureUuid`);
    
    let updatedCount = 0;
    
    for (const user of usersWithImages) {
      try {
        const imageUrl = user.profile.images;
        console.log(`\ud83d\udd0d Processing user ${user._id}: ${imageUrl}`);
        
        // Extract UUID from the image URL
        // URL format: https://f004.backblazeb2.com/file/dev-profiles/profile_pictures/{uuid}.jpg
        const urlMatch = imageUrl.match(/profile_pictures\/([a-f0-9-]+)\.jpg/);
        
        if (urlMatch && urlMatch[1]) {
          const uuid = urlMatch[1];
          console.log(`\ud83d\udccb Extracted UUID: ${uuid}`);
          
          // Fix the image URL to use the correct endpoint
          const correctedImageUrl = imageUrl.replace('f004.backblazeb2.com', 'f003.backblazeb2.com');
          console.log(`\ud83d\udccb Corrected image URL: ${correctedImageUrl}`);
          
          // Update user with the UUID and corrected URL
          await User.findByIdAndUpdate(user._id, {
            $set: {
              profilePictureUuid: uuid,
              'profile.images': correctedImageUrl
            }
          });
          
          updatedCount++;
          console.log(`\u2705 Updated user ${user._id} with UUID: ${uuid} and corrected URL`);
        } else {
          console.log(`\u274c Could not extract UUID from URL: ${imageUrl}`);
        }
        
      } catch (error) {
        console.error(`\u274c Error processing user ${user._id}:`, error.message);
      }
    }
    
    console.log(`\ud83c\udf89 Fix completed! Updated ${updatedCount} users`);
    
    // Verification
    const usersWithUuid = await User.find({
      profilePictureUuid: { $exists: true, $ne: null }
    });
    
    const usersWithoutUuid = await User.find({
      'profile.images': { $exists: true, $ne: null, $ne: '' },
      $or: [
        { profilePictureUuid: { $exists: false } },
        { profilePictureUuid: null }
      ]
    });
    
    console.log(`\ud83d\udcca Verification:`);
    console.log(`  - Users with profilePictureUuid: ${usersWithUuid.length}`);
    console.log(`  - Users still missing profilePictureUuid: ${usersWithoutUuid.length}`);
    
  } catch (error) {
    console.error('\u274c Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

// Run the fix
fixMissingProfilePictureUuid(); 
