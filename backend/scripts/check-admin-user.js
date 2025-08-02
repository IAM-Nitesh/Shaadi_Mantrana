// Script to check admin user details and verify login capability
const mongoose = require('mongoose');

async function checkAdminUser() {
  try {
    console.log('🔍 Checking admin user details...');
    
    const mongoUri = 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const { User, PreapprovedEmail } = require('../src/models');

    // Check admin user in users collection
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (adminUser) {
      console.log('\n👑 Admin User Details:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   UUID: ${adminUser.userUuid}`);
      console.log(`   Status: ${adminUser.status}`);
      console.log(`   Created: ${adminUser.createdAt}`);
    } else {
      console.log('❌ No admin user found in users collection');
    }

    // Check if admin exists in preapproved emails
    const adminPreapproved = await PreapprovedEmail.findOne({ email: 'codebynitesh@gmail.com' });
    
    if (adminPreapproved) {
      console.log('\n⚠️  Admin found in preapproved emails (should not be there):');
      console.log(`   Email: ${adminPreapproved.email}`);
      console.log(`   Approved: ${adminPreapproved.approvedByAdmin}`);
    } else {
      console.log('\n✅ Admin correctly NOT in preapproved emails collection');
    }

    // Test login logic
    console.log('\n🔐 Testing login logic:');
    const testEmail = 'codebynitesh@gmail.com';
    
    // Simulate the login check logic
    const existingUser = await User.findOne({ email: testEmail });
    const isAdmin = existingUser && existingUser.role === 'admin';
    const preapproved = await PreapprovedEmail.findOne({ email: testEmail });
    
    console.log(`   Email: ${testEmail}`);
    console.log(`   User exists: ${!!existingUser}`);
    console.log(`   Is admin: ${isAdmin}`);
    console.log(`   In preapproved: ${!!preapproved}`);
    
    if (isAdmin) {
      console.log('   ✅ Admin can login (bypasses preapproved check)');
    } else if (preapproved && preapproved.approvedByAdmin) {
      console.log('   ✅ Regular user can login (approved by admin)');
    } else {
      console.log('   ❌ User cannot login (not approved)');
    }

    console.log('\n✅ Admin user check completed!');

  } catch (error) {
    console.error('❌ Check error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

checkAdminUser(); 