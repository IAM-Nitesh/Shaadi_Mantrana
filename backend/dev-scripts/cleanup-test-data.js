// Selective cleanup script to remove only test data
const mongoose = require('mongoose');

async function cleanupTestData() {
  try {
  const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');
  await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get current counts before cleanup
    const preapprovedCount = await db.collection('preapprovedemails').countDocuments();
    const invitationsCount = await db.collection('invitations').countDocuments();
    const usersCount = await db.collection('users').countDocuments();
    
    console.log('\ud83d\udcca Current database state:');
    console.log(`   - Preapproved emails: ${preapprovedCount}`);
    console.log(`   - Invitations: ${invitationsCount}`);
    console.log(`   - Users: ${usersCount}`);
    
    console.log('\\n\ud83e\uddf9 Starting selective cleanup (test data only)...');
    
    // Remove test preapproved emails (example.com domains and test emails)
    console.log('\\n\ud83d\uddd1\ufe0f  Cleaning up test preapproved emails...');
    const testPreapprovedResult = await db.collection('preapprovedemails').deleteMany({
      $or: [
        { email: { $regex: /@example\\.com$/ } },
        { email: { $regex: /test@/ } },
        { email: { $regex: /demo@/ } },
        { email: { $regex: /admin@shaadimantrana\\.com$/ } }
      ]
    });
    console.log(`\u2705 Removed ${testPreapprovedResult.deletedCount} test preapproved emails`);
    
    // Remove test invitations
    console.log('\\n\ud83d\uddd1\ufe0f  Cleaning up test invitations...');
    const testInvitationsResult = await db.collection('invitations').deleteMany({
      $or: [
        { email: { $regex: /@example\\.com$/ } },
        { email: { $regex: /test@/ } },
        { email: { $regex: /demo@/ } },
        { email: { $regex: /admin@shaadimantrana\\.com$/ } }
      ]
    });
    console.log(`\u2705 Removed ${testInvitationsResult.deletedCount} test invitations`);
    
    // Remove test users
    console.log('\\n\ud83d\uddd1\ufe0f  Cleaning up test users...');
    const testUsersResult = await db.collection('users').deleteMany({
      $or: [
        { email: { $regex: /@example\\.com$/ } },
        { email: { $regex: /test@/ } },
        { email: { $regex: /demo@/ } },
        { email: { $regex: /admin@shaadimantrana\\.com$/ } }
      ]
    });
    console.log(`\u2705 Removed ${testUsersResult.deletedCount} test users`);
    
    // Get final counts
    const finalPreapprovedCount = await db.collection('preapprovedemails').countDocuments();
    const finalInvitationsCount = await db.collection('invitations').countDocuments();
    const finalUsersCount = await db.collection('users').countDocuments();
    
    console.log('\\n\ud83d\udcca Final database state:');
    console.log(`   - Preapproved emails: ${finalPreapprovedCount}`);
    console.log(`   - Invitations: ${finalInvitationsCount}`);
    console.log(`   - Users: ${finalUsersCount}`);
    
    console.log('\\n\u2705 Test data cleanup completed successfully!');
    console.log('\\ud83c\udf89 Production data has been preserved.');

  } catch (error) {
    console.error('\u274c Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupTestData(); 
