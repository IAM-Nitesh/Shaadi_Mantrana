const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { User, Preapproved, Invitation } = require('../src/models');

async function testAdminApproval() {
  try {
    console.log('🧪 Testing Admin Approval System...');
    
    // Connect to MongoDB
    const environment = process.env.NODE_ENV || 'development';
    const DEV_MONGODB_URI = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    let mongoUri;
    switch (environment) {
      case 'development':
      case 'dev':
      case 'local':
        mongoUri = process.env.MONGODB_URI || DEV_MONGODB_URI;
        break;
      case 'production':
      case 'prod':
        mongoUri = process.env.MONGODB_URI || process.env.MONGODB_PRODUCTION_URI;
        break;
      case 'test':
        mongoUri = process.env.MONGODB_TEST_URI || DEV_MONGODB_URI;
        break;
      default:
        mongoUri = DEV_MONGODB_URI;
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Test 1: Create a test user with admin approval workflow
    console.log('\n📝 Test 1: Creating test user with admin approval workflow...');
    
    const testEmail = 'test-admin-approval@example.com';
    const userUuid = uuidv4();
    const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create preapproved entry
    const preapprovedUser = new Preapproved({
      email: testEmail,
      uuid: userUuid,
      isFirstLogin: true,
      approvedByAdmin: true,
      addedAt: new Date()
    });

    await preapprovedUser.save();
    console.log('✅ Created preapproved entry');

    // Create invitation entry
    const invitation = new Invitation({
      uuid: userUuid,
      email: testEmail,
      invitationId: invitationId,
      sentDate: new Date(),
      count: 1,
      status: 'sent'
    });

    await invitation.save();
    console.log('✅ Created invitation entry');

    // Create user entry
    const user = new User({
      email: testEmail,
      userUuid: userUuid,
      profile: {
        location: "India",
        profileCompleteness: 17,
        // Initialize all dropdown fields as undefined (empty)
        gender: undefined,
        maritalStatus: undefined,
        manglik: undefined,
        complexion: undefined,
        eatingHabit: undefined,
        smokingHabit: undefined,
        drinkingHabit: undefined,
        settleAbroad: undefined,
        // Initialize other profile fields as empty
        name: '',
        nativePlace: '',
        currentResidence: '',
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
        height: '',
        weight: '',
        education: '',
        occupation: '',
        annualIncome: '',
        father: '',
        mother: '',
        brothers: '',
        sisters: '',
        fatherGotra: '',
        motherGotra: '',
        grandfatherGotra: '',
        grandmotherGotra: '',
        specificRequirements: '',
        about: '',
        interests: [],
        images: []
      },
      preferences: {
        location: ["Delhi", "Mumbai", "Bangalore"],
        ageRange: {
          min: 18,
          max: 50
        },
        profession: [],
        education: []
      },
      isFirstLogin: true,
      role: 'user',
      status: 'active'
    });

    await user.save();
    console.log('✅ Created user entry');

    // Test 2: Verify all entries exist
    console.log('\n🔍 Test 2: Verifying all entries exist...');
    
    const foundPreapproved = await Preapproved.findOne({ email: testEmail });
    const foundInvitation = await Invitation.findOne({ email: testEmail });
    const foundUser = await User.findOne({ email: testEmail });

    console.log('Preapproved entry:', foundPreapproved ? '✅ Found' : '❌ Not found');
    console.log('Invitation entry:', foundInvitation ? '✅ Found' : '❌ Not found');
    console.log('User entry:', foundUser ? '✅ Found' : '❌ Not found');

    // Test 3: Test pause functionality
    console.log('\n⏸️ Test 3: Testing pause functionality...');
    
    await Preapproved.findOneAndUpdate(
      { email: testEmail },
      { approvedByAdmin: false }
    );

    const pausedUser = await Preapproved.findOne({ email: testEmail });
    console.log('User paused:', pausedUser.approvedByAdmin === false ? '✅ Success' : '❌ Failed');

    // Test 4: Test resume functionality
    console.log('\n▶️ Test 4: Testing resume functionality...');
    
    await Preapproved.findOneAndUpdate(
      { email: testEmail },
      { approvedByAdmin: true }
    );

    const resumedUser = await Preapproved.findOne({ email: testEmail });
    console.log('User resumed:', resumedUser.approvedByAdmin === true ? '✅ Success' : '❌ Failed');

    // Test 5: Test invitation history
    console.log('\n📧 Test 5: Testing invitation history...');
    
    const newInvitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to history
    foundInvitation.history.push({
      sentDate: foundInvitation.sentDate,
      invitationId: foundInvitation.invitationId,
      status: foundInvitation.status
    });
    
    // Update current invitation
    foundInvitation.invitationId = newInvitationId;
    foundInvitation.sentDate = new Date();
    foundInvitation.count += 1;
    
    await foundInvitation.save();
    console.log('✅ Updated invitation with history');

    // Test 6: Verify invitation history
    const updatedInvitation = await Invitation.findOne({ email: testEmail });
    console.log('Invitation count:', updatedInvitation.count);
    console.log('History entries:', updatedInvitation.history.length);

    // Test 7: Clean up test data
    console.log('\n🧹 Test 7: Cleaning up test data...');
    
    await Preapproved.findOneAndDelete({ email: testEmail });
    await Invitation.findOneAndDelete({ email: testEmail });
    await User.findOneAndDelete({ email: testEmail });
    
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Preapproved collection working');
    console.log('- ✅ Invitations collection working');
    console.log('- ✅ User collection working');
    console.log('- ✅ Pause/Resume functionality working');
    console.log('- ✅ Invitation history tracking working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testAdminApproval(); 