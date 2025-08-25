// Script to remove admin users from preapproved emails collection
const mongoose = require('mongoose');

async function removeAdminFromPreapproved() {
  try {
    console.log('🧹 Removing admin users from preapproved emails...');
    
    const mongoUri = 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get admin users from users collection
    const { User } = require('../src/models');
    const adminUsers = await User.find({ role: 'admin' });
    
    console.log(`\n👑 Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role})`);
    });
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found in users collection');
      return;
    }
    
    // Remove admin emails from preapprovedemails collection
    const { PreapprovedEmail } = require('../src/models');
    
    for (const admin of adminUsers) {
      const result = await PreapprovedEmail.deleteOne({ email: admin.email });
      if (result.deletedCount > 0) {
        console.log(`✅ Removed admin email: ${admin.email}`);
      } else {
        console.log(`ℹ️  Admin email not found in preapproved: ${admin.email}`);
      }
    }
    
    // Check final state
    const remainingPreapproved = await PreapprovedEmail.countDocuments();
    console.log(`\n📊 Final preapproved emails count: ${remainingPreapproved}`);
    
    if (remainingPreapproved > 0) {
      const remainingEmails = await PreapprovedEmail.find({}, 'email');
      console.log('📧 Remaining preapproved emails:');
      remainingEmails.forEach(email => {
        console.log(`   - ${email.email}`);
      });
    }
    
    console.log('\n✅ Admin removal completed!');
    console.log('📋 Summary:');
    console.log('   - Admin users removed from preapproved emails');
    console.log('   - Admin users remain in users collection');
    console.log('   - Admin login will work via role-based authentication');

  } catch (error) {
    console.error('❌ Removal error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

removeAdminFromPreapproved(); 