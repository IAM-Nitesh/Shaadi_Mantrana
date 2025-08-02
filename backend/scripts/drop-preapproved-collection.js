const mongoose = require('mongoose');
require('dotenv').config();

async function dropPreapprovedCollection() {
  try {
    console.log('🚀 Starting deletion of PreapprovedEmail collection...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get the database connection
    const db = mongoose.connection.db;
    
    // Check if collection exists
    const collections = await db.listCollections().toArray();
    const preapprovedCollection = collections.find(col => col.name === 'preapprovedemails');
    
    if (!preapprovedCollection) {
      console.log('ℹ️  PreapprovedEmail collection does not exist');
      return;
    }

    console.log('📧 Found preapprovedemails collection, dropping...');
    
    // Drop the collection
    await db.dropCollection('preapprovedemails');
    
    console.log('✅ PreapprovedEmail collection dropped successfully');
    
    // Verify collection is gone
    const updatedCollections = await db.listCollections().toArray();
    const collectionStillExists = updatedCollections.find(col => col.name === 'preapprovedemails');
    
    if (!collectionStillExists) {
      console.log('✅ Verification: Collection successfully removed');
    } else {
      console.log('❌ Verification: Collection still exists');
    }
    
  } catch (error) {
    console.error('❌ Failed to drop collection:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run deletion
dropPreapprovedCollection(); 