// Script to completely remove old collections
const mongoose = require('mongoose');

async function cleanupOldCollections() {
  try {
    console.log('\ud83e\uddf9 Starting old collections cleanup...');
    
    const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI || '';

    if (!mongoUri) {
      console.error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment or .env.development');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // List all current collections
    console.log('\\n\ud83d\udcca Current collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    // Collections to remove
    const collectionsToRemove = [
      'connections',
      'preapproveds'  // Old schema name
    ];
    
    console.log('\\n\ud83d\uddd1\ufe0f  Removing old collections...');
    
    for (const collectionName of collectionsToRemove) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log('\u26a0\ufe0f  ${collectionName}: ${count} documents will be lost!');
        }
        
        await db.collection(collectionName).drop();
        console.log('\u2705 Removed collection: ${collectionName}');
      } catch (error) {
        if (error.message.includes('not found')) {
          console.log('\u2139\ufe0f  Collection ${collectionName} not found (already removed)');
        } else {
          console.log('\u274c Error removing ${collectionName}:', error.message);
        }
      }
    }
    
    // Verify final state
    console.log('\\n\ud83d\udcca Final collections:');
    const finalCollections = await db.listCollections().toArray();
    finalCollections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    console.log('\\n\u2705 Old collections cleanup completed!');
    console.log('\\ud83d\udccb Summary:');
    console.log('   - Removed old connections collection');
    console.log('   - Removed old preapproveds collection');
    console.log('   - Kept: users, preapprovedemails, invitations, matches');

  } catch (error) {
    console.error('\u274c Cleanup error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

cleanupOldCollections(); 
