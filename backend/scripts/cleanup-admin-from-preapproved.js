// Clean up admin users from preapproved collection
const mongoose = require('mongoose');

async function cleanupAdminFromPreapproved() {
  try {
    console.log('🧹 Cleaning up admin users from preapproved collection...');
    
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get all admin users from users collection
    const adminUsers = await db.collection('users').find({ role: 'admin' }).toArray();
    console.log(`\n👑 Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (role: ${user.role})`);
    });
    
    // Remove admin users from preapproved collection
    const adminEmails = adminUsers.map(user => user.email);
    const result = await db.collection('preapprovedemails').deleteMany({
      email: { $in: adminEmails }
    });
    
    console.log(`\n🗑️  Removed ${result.deletedCount} admin users from preapproved collection`);
    
    // Show remaining preapproved emails
    const remainingPreapproved = await db.collection('preapprovedemails').find({}).toArray();
    console.log(`\n📧 Remaining preapproved emails (${remainingPreapproved.length}):`);
    remainingPreapproved.forEach(preapproved => {
      console.log(`   - ${preapproved.email} (approved: ${preapproved.approvedByAdmin})`);
    });
    
    // Verify admin users still exist in users collection
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

cleanupAdminFromPreapproved(); 