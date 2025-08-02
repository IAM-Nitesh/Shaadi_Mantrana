// Script to completely remove old collections
const mongoose = require('mongoose');

async function cleanupOldCollections() {
  try {
    console.log('🧹 Starting old collections cleanup...');
    
    const mongoUri = 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // List all current collections
    console.log('\n📊 Current collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    // Collections to remove
    const collectionsToRemove = [
      'connections',
      'preapproveds'  // Old schema name
    ];
    
    console.log('\n🗑️  Removing old collections...');
    
    for (const collectionName of collectionsToRemove) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          console.log(`⚠️  ${collectionName}: ${count} documents will be lost!`);
        }
        
        await db.collection(collectionName).drop();
        console.log(`✅ Removed collection: ${collectionName}`);
      } catch (error) {
        if (error.message.includes('not found')) {
          console.log(`ℹ️  Collection ${collectionName} not found (already removed)`);
        } else {
          console.log(`❌ Error removing ${collectionName}:`, error.message);
        }
      }
    }
    
    // Verify final state
    console.log('\n📊 Final collections:');
    const finalCollections = await db.listCollections().toArray();
    finalCollections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    console.log('\n✅ Old collections cleanup completed!');
    console.log('📋 Summary:');
    console.log('   - Removed old connections collection');
    console.log('   - Removed old preapproveds collection');
    console.log('   - Kept: users, preapprovedemails, invitations, matches');

  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

cleanupOldCollections(); 