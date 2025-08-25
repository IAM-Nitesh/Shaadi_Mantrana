// Check database state script
const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    console.log('\ud83d\udd0d Checking database state...');
    
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check all collections
    const preapprovedCount = await db.collection('preapprovedemails').countDocuments();
    const invitationsCount = await db.collection('invitations').countDocuments();
    const usersCount = await db.collection('users').countDocuments();
    
    console.log('\\n\ud83d\udcca Database State:');
    console.log(`   - Preapproved emails: ${preapprovedCount}`);
    console.log(`   - Invitations: ${invitationsCount}`);
    console.log(`   - Users: ${usersCount}`);
    
    if (preapprovedCount === 0 && invitationsCount === 0 && usersCount === 0) {
      console.log('\\n\u2705 Database is clean and ready for fresh start!');
    } else {
      console.log('\\n\u26a0\ufe0f  Database still has data. Run cleanup if needed.');
    }

  } catch (error) {
    console.error('\u274c Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected');
  }
}

checkDatabase(); 
