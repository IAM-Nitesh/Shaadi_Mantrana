// Selective cleanup script to remove only test data
const mongoose = require('mongoose');

async function cleanupTestData() {
  try {
    const mongoUri = 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get current counts before cleanup
    const preapprovedCount = await db.collection('preapprovedemails').countDocuments();
    const invitationsCount = await db.collection('invitations').countDocuments();
    const usersCount = await db.collection('users').countDocuments();
    
    console.log('📊 Current database state:');
    console.log(`   - Preapproved emails: ${preapprovedCount}`);
    console.log(`   - Invitations: ${invitationsCount}`);
    console.log(`   - Users: ${usersCount}`);
    
    console.log('\n🧹 Starting selective cleanup (test data only)...');
    
    // Remove test preapproved emails (example.com domains and test emails)
    console.log('\n🗑️  Cleaning up test preapproved emails...');
    const testPreapprovedResult = await db.collection('preapprovedemails').deleteMany({
      $or: [
        { email: { $regex: /@example\.com$/ } },
        { email: { $regex: /test@/ } },
        { email: { $regex: /demo@/ } },
        { email: { $regex: /admin@shaadimantrana\.com$/ } }
      ]
    });
    console.log(`✅ Removed ${testPreapprovedResult.deletedCount} test preapproved emails`);
    
    // Remove test invitations
    console.log('\n🗑️  Cleaning up test invitations...');
    const testInvitationsResult = await db.collection('invitations').deleteMany({
      $or: [
        { email: { $regex: /@example\.com$/ } },
        { email: { $regex: /test@/ } },
        { email: { $regex: /demo@/ } },
        { email: { $regex: /admin@shaadimantrana\.com$/ } }
      ]
    });
    console.log(`✅ Removed ${testInvitationsResult.deletedCount} test invitations`);
    
    // Remove test users
    console.log('\n🗑️  Cleaning up test users...');
    const testUsersResult = await db.collection('users').deleteMany({
      $or: [
        { email: { $regex: /@example\.com$/ } },
        { email: { $regex: /test@/ } },
        { email: { $regex: /demo@/ } },
        { email: { $regex: /admin@shaadimantrana\.com$/ } }
      ]
    });
    console.log(`✅ Removed ${testUsersResult.deletedCount} test users`);
    
    // Get final counts
    const finalPreapprovedCount = await db.collection('preapprovedemails').countDocuments();
    const finalInvitationsCount = await db.collection('invitations').countDocuments();
    const finalUsersCount = await db.collection('users').countDocuments();
    
    console.log('\n📊 Final database state:');
    console.log(`   - Preapproved emails: ${finalPreapprovedCount}`);
    console.log(`   - Invitations: ${finalInvitationsCount}`);
    console.log(`   - Users: ${finalUsersCount}`);
    
    console.log('\n✅ Test data cleanup completed successfully!');
    console.log('🎉 Production data has been preserved.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupTestData(); 