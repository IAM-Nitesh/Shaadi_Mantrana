// Check all preapproved emails
const mongoose = require('mongoose');

async function checkAllPreapproved() {
  try {
    console.log('🔍 Checking all preapproved emails...');
    
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check all preapproved emails
    const allPreapproved = await db.collection('preapprovedemails').find({}).toArray();
    console.log(`\n📧 All preapproved emails (${allPreapproved.length}):`);
    
    if (allPreapproved.length === 0) {
      console.log('   - No preapproved emails found');
    } else {
      allPreapproved.forEach((preapproved, index) => {
        console.log(`   ${index + 1}. ${preapproved.email} (approved: ${preapproved.approvedByAdmin}, added: ${preapproved.addedAt})`);
      });
    }
    
    // Check all users
    const allUsers = await db.collection('users').find({}).toArray();
    console.log(`\n👥 All users (${allUsers.length}):`);
    
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (role: ${user.role}, status: ${user.status})`);
    });
    
    // Check all invitations
    const allInvitations = await db.collection('invitations').find({}).toArray();
    console.log(`\n📨 All invitations (${allInvitations.length}):`);
    
    if (allInvitations.length === 0) {
      console.log('   - No invitations found');
    } else {
      allInvitations.forEach((invitation, index) => {
        console.log(`   ${index + 1}. ${invitation.email} (count: ${invitation.count || 0})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkAllPreapproved(); 