// Comprehensive cleanup: Remove admin users from preapproved and clean invitations
const mongoose = require('mongoose');

async function cleanupAdminAndInvitations() {
  try {
    console.log('🧹 Comprehensive cleanup: Admin users and invitations...');
    
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Step 1: Get all admin users
    const adminUsers = await db.collection('users').find({ role: 'admin' }).toArray();
    console.log(`\n👑 Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (role: ${user.role})`);
    });
    
    // Step 2: Remove admin users from preapproved collection
    const adminEmails = adminUsers.map(user => user.email);
    const preapprovedResult = await db.collection('preapprovedemails').deleteMany({
      email: { $in: adminEmails }
    });
    console.log(`\n🗑️  Removed ${preapprovedResult.deletedCount} admin users from preapproved collection`);
    
    // Step 3: Clean up invitations collection
    console.log('\n📧 Cleaning up invitations collection...');
    
    // Remove invitations for admin users
    const invitationResult = await db.collection('invitations').deleteMany({
      email: { $in: adminEmails }
    });
    console.log(`   - Removed ${invitationResult.deletedCount} invitations for admin users`);
    
    // Remove invitations with null invitationCode
    const nullInvitationResult = await db.collection('invitations').deleteMany({
      invitationCode: null
    });
    console.log(`   - Removed ${nullInvitationResult.deletedCount} invitations with null invitationCode`);
    
    // Remove invitations with empty invitationCode
    const emptyInvitationResult = await db.collection('invitations').deleteMany({
      invitationCode: ""
    });
    console.log(`   - Removed ${emptyInvitationResult.deletedCount} invitations with empty invitationCode`);
    
    // Step 4: Show final state
    const remainingPreapproved = await db.collection('preapprovedemails').find({}).toArray();
    console.log(`\n📧 Remaining preapproved emails (${remainingPreapproved.length}):`);
    remainingPreapproved.forEach(preapproved => {
      console.log(`   - ${preapproved.email} (approved: ${preapproved.approvedByAdmin})`);
    });
    
    const remainingInvitations = await db.collection('invitations').find({}).toArray();
    console.log(`\n📨 Remaining invitations (${remainingInvitations.length}):`);
    remainingInvitations.forEach(invitation => {
      console.log(`   - ${invitation.email} (invitationCode: ${invitation.invitationCode || 'null'})`);
    });
    
    const remainingAdminUsers = await db.collection('users').find({ role: 'admin' }).toArray();
    console.log(`\n✅ Admin users still in users collection (${remainingAdminUsers.length}):`);
    remainingAdminUsers.forEach(user => {
      console.log(`   - ${user.email} (role: ${user.role}, status: ${user.status})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

cleanupAdminAndInvitations(); 