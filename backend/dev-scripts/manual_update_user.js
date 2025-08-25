/**
 * Manual Update User Script
 * Manually updates the user with profilePictureUuid
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection (using same URI as main app)
const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';

async function manualUpdateUser() {
  try {
    console.log('\ud83d\udd04 Manually updating user...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');
    
    // Import User model
    const User = require('../src/models/User');
    
    // Extract UUID from the image URL
    const imageUrl = 'https://f003.backblazeb2.com/file/dev-profiles/profile_pictures/50ca3653-a3a7-4d2d-aedc-e600df9f9250.jpg';
    const urlMatch = imageUrl.match(/profile_pictures\/([a-f0-9-]+)\.jpg/);
    const uuid = urlMatch[1];
    
    console.log(`\ud83d\udccb Extracted UUID: ${uuid}`);
    
    // Update the user directly
    const result = await User.findByIdAndUpdate(
      '688756bf0c39e9ad06d67a62',
      {
        $set: {
          profilePictureUuid: uuid
        }
      },
      { new: true }
    );
    
    if (result) {
      console.log('\u2705 User updated successfully');
      console.log(`\ud83d\udccb Updated user profilePictureUuid: ${result.profilePictureUuid}`);
    } else {
      console.log('\u274c User update failed');
    }
    
  } catch (error) {
    console.error('\u274c Manual update failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

// Run the manual update
manualUpdateUser(); 
