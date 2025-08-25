/**
 * Migrate to UserId Format Script
 * Re-uploads existing images with userId-based filenames
 */

// Load environment variables from .env.development
require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');

// MongoDB connection (using same URI as main app)
const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';

async function migrateToUserIdFormat() {
  try {
    console.log('🔄 Starting migration to userId-based format...');
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Import User model and B2StorageService
    const User = require('../src/models/User');
    const B2StorageService = require('../src/services/b2StorageService');
    
    // Find users with existing profile pictures
    const usersWithImages = await User.find({
      'profile.images': { $exists: true, $ne: null, $ne: '' }
    });
    
    console.log(`📊 Found ${usersWithImages.length} users with profile pictures`);
    
    const b2Storage = new B2StorageService();
    
    for (const user of usersWithImages) {
      try {
        console.log(`🔍 Processing user: ${user._id} (${user.email})`);
        console.log(`📋 Current image URL: ${user.profile.images}`);
        
        // Download the existing image
        console.log('🔄 Downloading existing image...');
        const imageBuffer = await new Promise((resolve, reject) => {
          const url = new URL(user.profile.images);
          const client = url.protocol === 'https:' ? https : http;
          
          const request = client.get(url, (response) => {
            if (response.statusCode !== 200) {
              reject(new Error(`HTTP ${response.statusCode}`));
              return;
            }
            
            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
          });
          
          request.on('error', reject);
        });
        
        console.log(`✅ Downloaded image: ${imageBuffer.length} bytes`);
        
        // Upload with new userId-based filename
        console.log('🔄 Uploading with new userId-based filename...');
        const uploadResult = await b2Storage.uploadProfilePicture(imageBuffer, user._id);
        console.log(`✅ Uploaded with new format: ${uploadResult.fileName}`);
        
        // Update user document with new URL
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'profile.images': uploadResult.url
          }
        });
        
        console.log(`✅ Updated user ${user._id} with new image URL`);
        
      } catch (error) {
        console.error(`❌ Error processing user ${user._id}:`, error.message);
      }
    }
    
    console.log('🎉 Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the migration
migrateToUserIdFormat(); 