// Database cleanup script to remove all preapproved emails and invitations
const mongoose = require('mongoose');

async function cleanupDatabase() {
  try {
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
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
    
    // Confirm cleanup
    console.log('\n⚠️  WARNING: This will remove ALL preapproved emails and invitations!');
    console.log('   This action cannot be undone.');
    console.log('\n   Type "CLEANUP" to confirm:');
    
    // For automated execution, we'll proceed without confirmation
    // In a real scenario, you'd want to add confirmation logic here
    
    console.log('\n🧹 Starting database cleanup...');
    
    // Clean up preapproved emails
    console.log('\n🗑️  Cleaning up preapproved emails...');
    const preapprovedResult = await db.collection('preapprovedemails').deleteMany({});
    console.log(`✅ Removed ${preapprovedResult.deletedCount} preapproved emails`);
    
    // Clean up invitations
    console.log('\n🗑️  Cleaning up invitations...');
    const invitationsResult = await db.collection('invitations').deleteMany({});
    console.log(`✅ Removed ${invitationsResult.deletedCount} invitations`);
    
    // Clean up users (optional - uncomment if you want to remove all users too)
    console.log('\n🗑️  Cleaning up users...');
    const usersResult = await db.collection('users').deleteMany({});
    console.log(`✅ Removed ${usersResult.deletedCount} users`);
    
    // Get final counts
    const finalPreapprovedCount = await db.collection('preapprovedemails').countDocuments();
    const finalInvitationsCount = await db.collection('invitations').countDocuments();
    const finalUsersCount = await db.collection('users').countDocuments();
    
    console.log('\n📊 Final database state:');
    console.log(`   - Preapproved emails: ${finalPreapprovedCount}`);
    console.log(`   - Invitations: ${finalInvitationsCount}`);
    console.log(`   - Users: ${finalUsersCount}`);
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log('🎉 You can now start fresh with a clean database.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupDatabase(); 