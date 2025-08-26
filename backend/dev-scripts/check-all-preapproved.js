// Check all preapproved emails
const mongoose = require('mongoose');

async function checkAllPreapproved() {
  try {
    console.log('\ud83d\udd0d Checking all preapproved emails...');
    
  const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');
  await mongoose.connect(mongoUri);
    console.log('\u2705 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check all preapproved emails
    const allPreapproved = await db.collection('preapprovedemails').find({}).toArray();
    console.log(`\\n\ud83d\udce7 All preapproved emails (${allPreapproved.length}):`);
    
    if (allPreapproved.length === 0) {
      console.log('   - No preapproved emails found');
    } else {
      allPreapproved.forEach((preapproved, index) => {
        console.log(`   ${index + 1}. ${preapproved.email} (approved: ${preapproved.approvedByAdmin}, added: ${preapproved.addedAt})`);
      });
    }
    
    // Check all users
    const allUsers = await db.collection('users').find({}).toArray();
    console.log(`\\n\ud83d\udc65 All users (${allUsers.length}):`);
    
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (role: ${user.role}, status: ${user.status})`);
    });
    
    // Check all invitations
    const allInvitations = await db.collection('invitations').find({}).toArray();
    console.log(`\\n\ud83d\udce8 All invitations (${allInvitations.length}):`);
    
    if (allInvitations.length === 0) {
      console.log('   - No invitations found');
    } else {
      allInvitations.forEach((invitation, index) => {
        console.log(`   ${index + 1}. ${invitation.email} (count: ${invitation.count || 0})`);
      });
    }

  } catch (error) {
    console.error('\u274c Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\u2705 Disconnected from MongoDB');
  }
}

checkAllPreapproved(); 
