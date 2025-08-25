// Test preapproved check logic
const mongoose = require('mongoose');
const { User, Preapproved } = require('../src/models');

async function testPreapprovedLogic() {
  try {
    console.log('🧪 Testing preapproved check logic...');
    
    const mongoUri = 'mongodb+srv://<REDACTED_USER>:<REDACTED_PASS>@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const testEmail = 'niteshkumar9591@gmail.com';
    
    // Check if email is in preapproved list
    const preapproved = await Preapproved.findOne({ email: testEmail });
    
    // Check if user is an admin
    const existingUser = await User.findOne({ email: testEmail });
    const isAdmin = existingUser && existingUser.role === 'admin';
    
    console.log('\n📊 Test Results:');
    console.log(`   - Email: ${testEmail}`);
    console.log(`   - User exists: ${!!existingUser}`);
    console.log(`   - User role: ${existingUser?.role}`);
    console.log(`   - Is admin: ${isAdmin}`);
    console.log(`   - Has preapproved: ${!!preapproved}`);
    console.log(`   - Preapproved approved: ${preapproved?.approvedByAdmin}`);
    
    // Test the logic
    let result;
    if (!isAdmin) {
      if (preapproved) {
        result = preapproved.approvedByAdmin;
      } else {
        result = false;
      }
    } else {
      result = true;
    }
    
    console.log(`\n🎯 Expected result: ${result}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testPreapprovedLogic(); 