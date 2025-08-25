const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB using the same config as the main app
const connectDB = async () => {
  try {
    // Use the same MongoDB URI as the main application
    const mongoURI = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoURI, {
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('\u2705 Connected to MongoDB');
  } catch (error) {
    console.error('\u274c MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix images field in existing users
const fixImagesField = async () => {
  try {
    console.log('\ud83d\udd27 Starting images field migration...');
    
    // Get the User model
    const User = require('../src/models/User');
    
    // Find all users with images as array
    const usersWithArrayImages = await User.find({
      'profile.images': { $type: 'array' }
    });
    
    console.log(`\ud83d\udcca Found ${usersWithArrayImages.length} users with images as array`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const user of usersWithArrayImages) {
      try {
        const images = user.profile.images;
        
        if (Array.isArray(images) && images.length > 0) {
          // Convert array to string (take first image)
          user.profile.images = images[0];
          await user.save();
          console.log(`\u2705 Updated user ${user.email}: array -> string (${images[0]})`);
          updatedCount++;
        } else if (Array.isArray(images) && images.length === 0) {
          // Convert empty array to null
          user.profile.images = null;
          await user.save();
          console.log(`\u2705 Updated user ${user.email}: empty array -> null`);
          updatedCount++;
        } else {
          console.log(`\u23ed\ufe0f Skipped user ${user.email}: already correct format`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`\u274c Error updating user ${user.email}:`, error.message);
      }
    }
    
    console.log('\n\ud83d\udcc8 Migration Summary:');
    console.log(`\u2705 Updated: ${updatedCount} users`);
    console.log(`\u23ed\ufe0f Skipped: ${skippedCount} users`);
    console.log(`\ud83d\udcca Total processed: ${usersWithArrayImages.length} users`);
    
    // Verify the fix
    const remainingArrayUsers = await User.find({
      'profile.images': { $type: 'array' }
    });
    
    if (remainingArrayUsers.length === 0) {
      console.log('\ud83c\udf89 All users have been successfully migrated!');
    } else {
      console.log(`\u26a0\ufe0f Warning: ${remainingArrayUsers.length} users still have images as array`);
    }
    
  } catch (error) {
    console.error('\u274c Migration error:', error);
  }
};

// Run the migration
const runMigration = async () => {
  try {
    await connectDB();
    await fixImagesField();
    console.log('\u2705 Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\u274c Migration failed:', error);
    process.exit(1);
  }
};

runMigration(); 
