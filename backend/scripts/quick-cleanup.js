// Quick database cleanup script
const mongoose = require('mongoose');

async function quickCleanup() {
  try {
    console.log('🧹 Starting database cleanup...');
    
    const mongoUri = 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Clean up all collections
    console.log('🗑️  Cleaning up preapproved emails...');
    await db.collection('preapprovedemails').deleteMany({});
    
    console.log('🗑️  Cleaning up invitations...');
    await db.collection('invitations').deleteMany({});
    
    console.log('🗑️  Cleaning up users...');
    await db.collection('users').deleteMany({});
    
    console.log('✅ Database cleanup completed!');
    console.log('🎉 You can now start fresh.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected');
  }
}

quickCleanup(); 