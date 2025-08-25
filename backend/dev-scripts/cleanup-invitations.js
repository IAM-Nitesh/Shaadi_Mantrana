// Simple script to clean up invitations collection
const mongoose = require('mongoose');

async function cleanupInvitations() {
  try {
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Remove documents with null invitationCode
    const result = await db.collection('invitations').deleteMany({
      invitationCode: null
    });
    
    console.log(`\u2705 Removed ${result.deletedCount} documents with null invitationCode`);

    // Try to drop the problematic index
    try {
      await db.collection('invitations').dropIndex('invitationCode_1');
      console.log('\u2705 Dropped invitationCode_1 index');
    } catch (error) {
      console.log('\u2139\ufe0f  invitationCode_1 index not found or already dropped');
    }

    console.log('\u2705 Cleanup completed');

  } catch (error) {
    console.error('\u274c Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected');
  }
}

cleanupInvitations(); 
