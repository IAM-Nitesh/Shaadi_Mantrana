const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB using the same config as the main app
const connectDB = async () => {
  try {
    // Use the same MongoDB URI as the main application
    const mongoURI = 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
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
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix images field in existing users
const fixImagesField = async () => {
  try {
    console.log('🔧 Starting images field migration...');
    
    // Get the User model
    const User = require('../src/models/User');
    
    // Find all users with images as array
    const usersWithArrayImages = await User.find({
      'profile.images': { $type: 'array' }
    });
    
    console.log(`📊 Found ${usersWithArrayImages.length} users with images as array`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const user of usersWithArrayImages) {
      try {
        const images = user.profile.images;
        
        if (Array.isArray(images) && images.length > 0) {
          // Convert array to string (take first image)
          user.profile.images = images[0];
          await user.save();
          console.log(`✅ Updated user ${user.email}: array -> string (${images[0]})`);
          updatedCount++;
        } else if (Array.isArray(images) && images.length === 0) {
          // Convert empty array to null
          user.profile.images = null;
          await user.save();
          console.log(`✅ Updated user ${user.email}: empty array -> null`);
          updatedCount++;
        } else {
          console.log(`⏭️ Skipped user ${user.email}: already correct format`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating user ${user.email}:`, error.message);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Updated: ${updatedCount} users`);
    console.log(`⏭️ Skipped: ${skippedCount} users`);
    console.log(`📊 Total processed: ${usersWithArrayImages.length} users`);
    
    // Verify the fix
    const remainingArrayUsers = await User.find({
      'profile.images': { $type: 'array' }
    });
    
    if (remainingArrayUsers.length === 0) {
      console.log('🎉 All users have been successfully migrated!');
    } else {
      console.log(`⚠️ Warning: ${remainingArrayUsers.length} users still have images as array`);
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
};

// Run the migration
const runMigration = async () => {
  try {
    await connectDB();
    await fixImagesField();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration(); 