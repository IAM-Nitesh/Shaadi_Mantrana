// Simple script to add admin email
const mongoose = require('mongoose');

async function addAdmin() {
  try {
    console.log('Adding admin email...');
    
  const mongoUri = process.env.MONGODB_URI || process.env.DEV_MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not configured. Set MONGODB_URI or DEV_MONGODB_URI in your environment.');
  await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Note: Admin users are not added to preapproved emails collection
    // They have special privileges and don't need preapproval
    console.log('Skipping preapproved emails (admin users have special privileges)');
    
    // Add to users collection
    const userResult = await db.collection('users').insertOne({
      email: 'codebynitesh@gmail.com',
      userUuid: 'admin-uuid-' + Date.now(),
      role: 'admin',
      status: 'active',
      isFirstLogin: true,
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
      createdAt: new Date()
    });
    
    console.log('Added to users:', userResult.insertedId);
    console.log('Admin user added successfully!');
    console.log('Note: Admin users are not added to preapproved emails collection');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

addAdmin(); 