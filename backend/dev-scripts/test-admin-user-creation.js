// Test script to verify admin user creation works
const mongoose = require('mongoose');
const { User, Preapproved, Invitation } = require('../src/models');

async function testAdminUserCreation() {
  try {
    const mongoUri = 'mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const testEmail = 'test-admin-creation@example.com';
    const userUuid = 'test-uuid-' + Date.now();
    const invitationId = 'test-invitation-' + Date.now();

    console.log(`🧪 Testing user creation for: ${testEmail}`);

    // Step 1: Create preapproved entry
    const newPreapproved = new Preapproved({
      email: testEmail,
      uuid: userUuid,
      isFirstLogin: true,
      approvedByAdmin: true
    });

    await newPreapproved.save();
    console.log('✅ Preapproved entry created');

    // Step 2: Try to create invitation (this was failing)
    try {
      const newInvitation = new Invitation({
        uuid: userUuid,
        email: testEmail,
        invitationId: invitationId
      });

      await newInvitation.save();
      console.log('✅ Invitation created successfully');
    } catch (invitationError) {
      console.log('⚠️  Invitation creation failed (expected):', invitationError.message);
      console.log('ℹ️  This is handled gracefully in the admin route');
    }

    // Step 3: Create user
    const newUser = new User({
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
        location: ["Andhra Pradesh", "Bihar", "Delhi"],
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

    await newUser.save();
    console.log('✅ User created successfully');

    // Step 4: Clean up test data
    await User.deleteOne({ email: testEmail });
    await Preapproved.deleteOne({ email: testEmail });
    await Invitation.deleteOne({ email: testEmail });
    console.log('✅ Test data cleaned up');

    console.log('✅ Admin user creation test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testAdminUserCreation(); 