// Quick database cleanup script
const mongoose = require('mongoose');

async function quickCleanup() {
  try {
    console.log('\ud83e\uddf9 Starting database cleanup...');
    
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Clean up all collections
    console.log('\ud83d\uddd1\ufe0f  Cleaning up preapproved emails...');
    await db.collection('preapprovedemails').deleteMany({});
    
    console.log('\ud83d\uddd1\ufe0f  Cleaning up invitations...');
    await db.collection('invitations').deleteMany({});
    
    console.log('\ud83d\uddd1\ufe0f  Cleaning up users...');
    await db.collection('users').deleteMany({});
    
    console.log('\u2705 Database cleanup completed!');
    console.log('\ud83c\udf89 You can now start fresh.');

  } catch (error) {
    console.error('\u274c Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected');
  }
}

quickCleanup(); 
