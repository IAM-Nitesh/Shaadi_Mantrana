/**
 * Migration Script: Convert images array to single string
 * Updates existing users who have images as an array to use a single string
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function migrateImagesToString() {
  try {
    console.log('🔄 Starting migration: Convert images array to single string...');
    
    // Connect to MongoDB (using same URI as main app)
  const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');
  await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find users with images array
    const usersWithArrayImages = await User.find({
      'profile.images': { $exists: true, $type: 'array' }
    });
    
    console.log(`📊 Found ${usersWithArrayImages.length} users with images array`);
    
    let updatedCount = 0;
    
    for (const user of usersWithArrayImages) {
      try {
        // Get the first image from the array (if it exists)
        const firstImage = user.profile.images && user.profile.images.length > 0 
          ? user.profile.images[0] 
          : null;
        
        // Update user to use single string
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'profile.images': firstImage
          }
        });
        
        updatedCount++;
        console.log(`✅ Updated user ${user._id}: ${firstImage ? 'has image' : 'no image'}`);
        
      } catch (error) {
        console.error(`❌ Error updating user ${user._id}:`, error.message);
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} users`);
    
    // Verify migration
    const usersWithStringImages = await User.find({
      'profile.images': { $exists: true, $type: 'string' }
    });
    
    const usersWithArrayImagesAfter = await User.find({
      'profile.images': { $exists: true, $type: 'array' }
    });
    
    console.log(`📊 Verification:`);
    console.log(`  - Users with string images: ${usersWithStringImages.length}`);
    console.log(`  - Users with array images: ${usersWithArrayImagesAfter.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run migration
migrateImagesToString(); 