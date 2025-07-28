# MongoDB Queries for Shaadi Mantra

This document contains all the MongoDB queries needed for the Shaadi Mantra application, including database setup, data insertion, and verification queries.

## Table of Contents
- [Database Setup](#database-setup)
- [Preapproved Emails](#preapproved-emails)
- [User Documents](#user-documents)
- [Verification Queries](#verification-queries)
- [Index Creation](#index-creation)
- [Sample Data](#sample-data)
- [Maintenance Queries](#maintenance-queries)

---

## Database Setup

### Drop Existing Collections (Fresh Start)
```javascript
// Drop existing collections
db.users.drop()
db.preapprovedemails.drop()

// Verify collections are dropped
show collections
```

### Check Current Database
```javascript
// Check current database
db.getName()

// List all collections
show collections

// Check database stats
db.stats()
```

---

## Preapproved Emails

### Insert Preapproved Emails
```javascript
db.preapprovedemails.insertMany([
  {
    email: "niteshkumar9591@gmail.com",
    uuid: "688488043c414327b110eb02",
    addedAt: new Date()
  },
  {
    email: "krtk1991@gmail.com",
    uuid: "688488043c414327b110eb03",
    addedAt: new Date()
  },
  {
    email: "krishankumar6363@gmail.com",
    uuid: "688488043c414327b110eb04",
    addedAt: new Date()
  },
  {
    email: "savita.rani6620@gmail.com",
    uuid: "688488043c414327b110eb05",
    addedAt: new Date()
  },
  {
    email: "codebynitesh@gmail.com",
    uuid: "688488043c414327b110eb99",
    addedAt: new Date()
  }
])
```

### Alternative UUID Generation
```javascript
// Using ObjectId for UUID generation
db.preapprovedemails.insertMany([
  {
    email: "niteshkumar9591@gmail.com",
    uuid: ObjectId().toString(),
    addedAt: new Date()
  },
  {
    email: "krtk1991@gmail.com",
    uuid: ObjectId().toString(),
    addedAt: new Date()
  },
  {
    email: "krishankumar6363@gmail.com",
    uuid: ObjectId().toString(),
    addedAt: new Date()
  },
  {
    email: "savita.rani6620@gmail.com",
    uuid: ObjectId().toString(),
    addedAt: new Date()
  },
  {
    email: "codebynitesh@gmail.com",
    uuid: ObjectId().toString(),
    addedAt: new Date()
  }
])
```

### Check Preapproved Emails
```javascript
// View all preapproved emails
db.preapprovedemails.find().pretty()

// Count preapproved emails
db.preapprovedemails.countDocuments()

// Find specific email
db.preapprovedemails.findOne({email: "niteshkumar9591@gmail.com"})

// Find by UUID
db.preapprovedemails.findOne({uuid: "688488043c414327b110eb02"})
```

---

## User Documents

### 1. Complete User Profile - krishankumar6363@gmail.com
```javascript
db.users.insertOne({
  userUuid: "688488043c414327b110eb04",
  email: "krishankumar6363@gmail.com",
  profile: {
    name: "Krishan Kumar",
    gender: "Male",
    nativePlace: "Rohtak",
    currentResidence: "Gurgaon",
    maritalStatus: "Never Married",
    manglik: "No",
    dateOfBirth: "1993-04-10",
    timeOfBirth: "08:30",
    placeOfBirth: "Rohtak",
    height: "5'9\"",
    weight: "72",
    complexion: "Medium",
    education: "B.Tech",
    occupation: "Engineer",
    annualIncome: "700000",
    eatingHabit: "Vegetarian",
    smokingHabit: "No",
    drinkingHabit: "No",
    father: "Mahesh Kumar",
    mother: "Sarla Devi",
    brothers: "1",
    sisters: "0",
    fatherGotra: "Kashyap",
    motherGotra: "Vatsa",
    grandfatherGotra: "Kashyap",
    grandmotherGotra: "Vatsa",
    specificRequirements: "Looking for a well-educated, family-oriented partner.",
    settleAbroad: "No",
    about: "Engineer, passionate about technology and family values.",
    interests: ["Technology", "Travel", "Music"],
    age: 31,
    profession: "Engineer",
    location: "Gurgaon",
    profileCompleteness: 95
  },
  verification: {
    isVerified: true,
    verifiedAt: new Date(),
    approvalType: "admin"
  },
  role: "user",
  status: "active",
  premium: false,
  lastActive: new Date(),
  loginHistory: [],
  preferences: {
    ageRange: { min: 25, max: 35 },
    location: ["Gurgaon", "Delhi", "Noida"],
    profession: ["Engineer", "Doctor", "Teacher"],
    education: ["Bachelor", "Master"]
  },
  isFirstLogin: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 2. Complete User Profile - savita.rani6620@gmail.com
```javascript
db.users.insertOne({
  userUuid: "688488043c414327b110eb05",
  email: "savita.rani6620@gmail.com",
  profile: {
    name: "Savita Rani",
    gender: "Female",
    nativePlace: "Panipat",
    currentResidence: "Delhi",
    maritalStatus: "Never Married",
    manglik: "Don't Know",
    dateOfBirth: "1996-12-05",
    timeOfBirth: "11:45",
    placeOfBirth: "Panipat",
    height: "5'4\"",
    weight: "58",
    complexion: "Fair",
    education: "M.Sc.",
    occupation: "Teacher",
    annualIncome: "400000",
    eatingHabit: "Vegetarian",
    smokingHabit: "No",
    drinkingHabit: "No",
    father: "Suresh Kumar",
    mother: "Kamla Devi",
    brothers: "0",
    sisters: "2",
    fatherGotra: "Bharadwaj",
    motherGotra: "Kashyap",
    grandfatherGotra: "Bharadwaj",
    grandmotherGotra: "Kashyap",
    specificRequirements: "Looking for a caring and supportive partner.",
    settleAbroad: "Maybe",
    about: "Teacher, loves reading and helping students grow.",
    interests: ["Reading", "Teaching", "Music"],
    age: 27,
    profession: "Teacher",
    location: "Delhi",
    profileCompleteness: 95
  },
  verification: {
    isVerified: true,
    verifiedAt: new Date(),
    approvalType: "admin"
  },
  role: "user",
  status: "active",
  premium: false,
  lastActive: new Date(),
  loginHistory: [],
  preferences: {
    ageRange: { min: 25, max: 35 },
    location: ["Delhi", "Panipat", "Gurgaon"],
    profession: ["Teacher", "Engineer", "Doctor"],
    education: ["Bachelor", "Master"]
  },
  isFirstLogin: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 3. Complete User Profile - krtk1991@gmail.com
```javascript
db.users.insertOne({
  userUuid: "688488043c414327b110eb03",
  email: "krtk1991@gmail.com",
  profile: {
    name: "Kartik Kumar",
    gender: "Male",
    nativePlace: "Sonipat",
    currentResidence: "Noida",
    maritalStatus: "Never Married",
    manglik: "No",
    dateOfBirth: "1991-08-20",
    timeOfBirth: "10:15",
    placeOfBirth: "Sonipat",
    height: "5'10\"",
    weight: "75",
    complexion: "Medium",
    education: "MBA",
    occupation: "Business Analyst",
    annualIncome: "900000",
    eatingHabit: "Non-Vegetarian",
    smokingHabit: "No",
    drinkingHabit: "Occasionally",
    father: "Ramesh Kumar",
    mother: "Sita Devi",
    brothers: "0",
    sisters: "2",
    fatherGotra: "Bharadwaj",
    motherGotra: "Kashyap",
    grandfatherGotra: "Bharadwaj",
    grandmotherGotra: "Kashyap",
    specificRequirements: "Looking for a caring and understanding partner.",
    settleAbroad: "Yes",
    about: "Business analyst, loves traveling and photography.",
    interests: ["Travel", "Photography", "Reading", "Movies"],
    age: 32,
    profession: "Business Analyst",
    location: "Noida",
    profileCompleteness: 90
  },
  verification: {
    isVerified: true,
    verifiedAt: new Date(),
    approvalType: "admin"
  },
  role: "user",
  status: "active",
  premium: false,
  lastActive: new Date(),
  loginHistory: [],
  preferences: {
    ageRange: { min: 25, max: 35 },
    location: ["Noida", "Delhi", "Gurgaon"],
    profession: ["Business Analyst", "Engineer", "Doctor"],
    education: ["Bachelor", "Master"]
  },
  isFirstLogin: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 4. New User (First Login) - niteshkumar9591@gmail.com
```javascript
db.users.insertOne({
  userUuid: "688488043c414327b110eb02",
  email: "niteshkumar9591@gmail.com",
  profile: {
    name: "",
    // Enum fields are omitted (undefined) instead of empty strings to avoid validation errors
    // gender: undefined,           // Valid enum values: "Male", "Female"
    // maritalStatus: undefined,    // Valid enum values: "Never Married", "Divorced", "Widowed", "Awaiting Divorce"
    // manglik: undefined,          // Valid enum values: "Yes", "No", "Don't Know"
    // complexion: undefined,       // Valid enum values: "Fair", "Medium", "Dark"
    // eatingHabit: undefined,      // Valid enum values: "Vegetarian", "Non-Vegetarian", "Eggetarian"
    // smokingHabit: undefined,     // Valid enum values: "Yes", "No", "Occasionally"
    // drinkingHabit: undefined,    // Valid enum values: "Yes", "No", "Occasionally"
    // settleAbroad: undefined,     // Valid enum values: "Yes", "No", "Maybe"
    nativePlace: "",
    currentResidence: "",
    dateOfBirth: "",
    timeOfBirth: "",
    placeOfBirth: "",
    height: "",
    weight: "",
    education: "",
    occupation: "",
    annualIncome: "",
    father: "",
    mother: "",
    brothers: "",
    sisters: "",
    fatherGotra: "",
    motherGotra: "",
    grandfatherGotra: "",
    grandmotherGotra: "",
    specificRequirements: "",
    about: "",
    interests: [],
    location: "India",
    profileCompleteness: 17
  },
  verification: {
    isVerified: true,
    verifiedAt: new Date(),
    approvalType: "otp"
  },
  role: "user",
  status: "active",
  premium: false,
  lastActive: new Date(),
  loginHistory: [],
  preferences: {
    ageRange: { min: 18, max: 50 },
    location: [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
      "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
      "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
      "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
      "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
      "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
      "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
      "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ],
    profession: [],
    education: []
  },
  isFirstLogin: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 4a. Alternative: New User with Sample Enum Values
```javascript
db.users.insertOne({
  userUuid: "688488043c414327b110eb04",
  email: "newuser@example.com",
  profile: {
    name: "New User",
    gender: "Male",                    // Valid enum value
    nativePlace: "Mumbai",
    currentResidence: "Mumbai",
    maritalStatus: "Never Married",    // Valid enum value
    manglik: "No",                     // Valid enum value
    dateOfBirth: "1995-01-01",
    timeOfBirth: "12:00",
    placeOfBirth: "Mumbai",
    height: "5'8\"",
    weight: "70",
    complexion: "Medium",              // Valid enum value
    education: "Bachelor's Degree",
    occupation: "Software Engineer",
    annualIncome: "800000",
    eatingHabit: "Vegetarian",         // Valid enum value
    smokingHabit: "No",                // Valid enum value
    drinkingHabit: "No",               // Valid enum value
    father: "Father Name",
    mother: "Mother Name",
    brothers: "1",
    sisters: "1",
    fatherGotra: "Gotra Name",
    motherGotra: "Gotra Name",
    grandfatherGotra: "Gotra Name",
    grandmotherGotra: "Gotra Name",
    specificRequirements: "Looking for a compatible partner",
    settleAbroad: "Maybe",             // Valid enum value
    about: "Software engineer with passion for technology",
    interests: ["Technology", "Reading", "Music"],
    location: "India",
    profileCompleteness: 85
  },
  verification: {
    isVerified: true,
    verifiedAt: new Date(),
    approvalType: "otp"
  },
  role: "user",
  status: "active",
  premium: false,
  lastActive: new Date(),
  loginHistory: [],
  preferences: {
    ageRange: { min: 25, max: 35 },
    location: ["Mumbai", "Pune", "Delhi"],
    profession: ["Software Engineer", "Doctor", "Teacher"],
    education: ["Bachelor", "Master"]
  },
  isFirstLogin: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 5. Admin User - codebynitesh@gmail.com
```javascript
db.users.insertOne({
  userUuid: "688488043c414327b110eb99",
  email: "codebynitesh@gmail.com",
  profile: {
    name: "Nitesh Admin",
    gender: "Male",
    nativePlace: "Delhi",
    currentResidence: "Delhi",
    maritalStatus: "Never Married",
    manglik: "No",
    dateOfBirth: "1990-01-01",
    timeOfBirth: "12:00",
    placeOfBirth: "Delhi",
    height: "5'11\"",
    weight: "80",
    complexion: "Fair",
    education: "M.Tech",
    occupation: "System Administrator",
    annualIncome: "1500000",
    eatingHabit: "Vegetarian",
    smokingHabit: "No",
    drinkingHabit: "No",
    father: "Admin Father",
    mother: "Admin Mother",
    brothers: "0",
    sisters: "1",
    fatherGotra: "Kashyap",
    motherGotra: "Vatsa",
    grandfatherGotra: "Kashyap",
    grandmotherGotra: "Vatsa",
    specificRequirements: "Admin account for system management",
    settleAbroad: "No",
    about: "System administrator for Shaadi Mantra platform",
    interests: ["Technology", "Management", "Security"],
    profileCompleteness: 100
  },
  verification: {
    isVerified: true,
    verifiedAt: new Date(),
    approvalType: "admin"
  },
  role: "admin",
  status: "active",
  premium: true,
  lastActive: new Date(),
  loginHistory: [],
  preferences: {
    ageRange: { min: 18, max: 60 },
    location: ["All"],
    profession: ["All"],
    education: ["All"]
  },
  isFirstLogin: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

---

## Verification Queries

### Check All Collections
```javascript
// List all collections
show collections

// Check collection counts
db.users.countDocuments()
db.preapprovedemails.countDocuments()
```

### Verify Preapproved Emails
```javascript
// View all preapproved emails
db.preapprovedemails.find().pretty()

// Find specific email
db.preapprovedemails.findOne({email: "niteshkumar9591@gmail.com"})

// Check email count
db.preapprovedemails.countDocuments()
```

### Verify Users
```javascript
// View all users with basic info
db.users.find({}, {email: 1, "profile.name": 1, role: 1, isFirstLogin: 1}).pretty()

// Find specific user
db.users.findOne({email: "niteshkumar9591@gmail.com"}).pretty()

// Check first login users
db.users.find({isFirstLogin: true}, {email: 1, "profile.name": 1}).pretty()

// Check admin users
db.users.find({role: "admin"}, {email: 1, "profile.name": 1}).pretty()

// Check profile completeness
db.users.find({}, {email: 1, "profile.profileCompleteness": 1, isFirstLogin: 1}).pretty()

// Check verified users
db.users.find({"verification.isVerified": true}, {email: 1, "profile.name": 1}).pretty()
```

### Advanced Queries
```javascript
// Find users by age range
db.users.find({"profile.age": {$gte: 25, $lte: 35}}, {email: 1, "profile.name": 1, "profile.age": 1}).pretty()

// Find users by location
db.users.find({"profile.location": "Delhi"}, {email: 1, "profile.name": 1, "profile.location": 1}).pretty()

// Find users by profession
db.users.find({"profile.profession": "Engineer"}, {email: 1, "profile.name": 1, "profile.profession": 1}).pretty()

// Find users with complete profiles
db.users.find({"profile.profileCompleteness": {$gte: 90}}, {email: 1, "profile.name": 1, "profile.profileCompleteness": 1}).pretty()

// Find users by gender
db.users.find({"profile.gender": "Female"}, {email: 1, "profile.name": 1, "profile.gender": 1}).pretty()
```

---

## Index Creation

### Performance Indexes
```javascript
// User collection indexes
db.users.createIndex({ "email": 1 })
db.users.createIndex({ "profile.age": 1 })
db.users.createIndex({ "profile.location": 1 })
db.users.createIndex({ "profile.profession": 1 })
db.users.createIndex({ "status": 1 })
db.users.createIndex({ "lastActive": -1 })
db.users.createIndex({ "createdAt": -1 })
db.users.createIndex({ "isFirstLogin": 1 })
db.users.createIndex({ "verification.isVerified": 1 })
db.users.createIndex({ "role": 1 })

// Preapproved emails indexes
db.preapprovedemails.createIndex({ "email": 1 })
db.preapprovedemails.createIndex({ "uuid": 1 })

// Compound indexes for better performance
db.users.createIndex({ "profile.gender": 1, "profile.age": 1 })
db.users.createIndex({ "profile.location": 1, "profile.profession": 1 })
```

### Check Existing Indexes
```javascript
// List all indexes
db.users.getIndexes()
db.preapprovedemails.getIndexes()
```

---

## Sample Data

### Bulk Insert Sample Users
```javascript
db.users.insertMany([
  {
    userUuid: "550e8400-e29b-41d4-a716-446655440005",
    email: "priya.sharma@example.com",
    profile: {
      name: "Priya Sharma",
      gender: "Female",
      nativePlace: "Delhi",
      currentResidence: "Bangalore",
      maritalStatus: "Never Married",
      manglik: "No",
      dateOfBirth: "1998-03-20",
      timeOfBirth: "09:15",
      placeOfBirth: "Delhi",
      height: "5'4\"",
      weight: "55",
      complexion: "Fair",
      education: "Master of Computer Applications",
      occupation: "Software Developer",
      annualIncome: "600000",
      eatingHabit: "Vegetarian",
      smokingHabit: "No",
      drinkingHabit: "No",
      father: "Ramesh Sharma",
      mother: "Kavita Sharma",
      brothers: "1",
      sisters: "0",
      fatherGotra: "Bharadwaj",
      motherGotra: "Kashyap",
      grandfatherGotra: "Bharadwaj",
      grandmotherGotra: "Kashyap",
      specificRequirements: "Looking for a caring and understanding partner",
      settleAbroad: "Yes",
      about: "I am a software developer who loves coding and cooking. I enjoy reading books and watching movies in my free time.",
      interests: ["Coding", "Cooking", "Reading", "Movies"],
      age: 26,
      profession: "Software Developer",
      location: "Bangalore",
      profileCompleteness: 90
    },
    verification: { isVerified: true, verifiedAt: new Date(), approvalType: "admin" },
    role: "user",
    status: "active",
    premium: false,
    lastActive: new Date(),
    loginHistory: [],
    preferences: {
      ageRange: { min: 25, max: 35 },
      location: ["Bangalore", "Delhi", "Mumbai"],
      profession: ["Software Engineer", "Doctor", "Teacher"],
      education: ["Bachelor", "Master"]
    },
    isFirstLogin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    userUuid: "550e8400-e29b-41d4-a716-446655440006",
    email: "arjun.patel@example.com",
    profile: {
      name: "Arjun Patel",
      gender: "Male",
      nativePlace: "Mumbai",
      currentResidence: "Mumbai",
      maritalStatus: "Never Married",
      manglik: "No",
      dateOfBirth: "1994-07-15",
      timeOfBirth: "16:30",
      placeOfBirth: "Mumbai",
      height: "5'11\"",
      weight: "78",
      complexion: "Medium",
      education: "MBBS",
      occupation: "Doctor",
      annualIncome: "1200000",
      eatingHabit: "Non-Vegetarian",
      smokingHabit: "No",
      drinkingHabit: "No",
      father: "Rajesh Patel",
      mother: "Meera Patel",
      brothers: "0",
      sisters: "1",
      fatherGotra: "Kashyap",
      motherGotra: "Vatsa",
      grandfatherGotra: "Kashyap",
      grandmotherGotra: "Vatsa",
      specificRequirements: "Looking for a well-educated, family-oriented partner",
      settleAbroad: "Maybe",
      about: "Doctor by profession, passionate about helping people. Love reading and traveling.",
      interests: ["Medicine", "Reading", "Travel", "Music"],
      age: 29,
      profession: "Doctor",
      location: "Mumbai",
      profileCompleteness: 95
    },
    verification: { isVerified: true, verifiedAt: new Date(), approvalType: "admin" },
    role: "user",
    status: "active",
    premium: true,
    lastActive: new Date(),
    loginHistory: [],
    preferences: {
      ageRange: { min: 25, max: 35 },
      location: ["Mumbai", "Delhi", "Bangalore"],
      profession: ["Doctor", "Engineer", "Teacher"],
      education: ["Bachelor", "Master", "PhD"]
    },
    isFirstLogin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

---

## Maintenance Queries

### Data Cleanup
```javascript
// Remove users with incomplete profiles (optional)
db.users.deleteMany({"profile.profileCompleteness": {$lt: 10}})

// Remove inactive users (optional)
db.users.deleteMany({status: "inactive"})

// Remove old login history (keep last 10 entries)
db.users.updateMany({}, {
  $set: {
    loginHistory: {
      $slice: ["$loginHistory", 10]
    }
  }
})
```

### Data Updates
```javascript
// Update all users to set isFirstLogin to false (if needed)
db.users.updateMany({}, {$set: {isFirstLogin: false}})

// Update specific user's profile
db.users.updateOne(
  {email: "niteshkumar9591@gmail.com"},
  {
    $set: {
      "profile.name": "Updated Name",
      "profile.profileCompleteness": 100,
      isFirstLogin: false
    }
  }
)

// Update user's last active time
db.users.updateOne(
  {email: "niteshkumar9591@gmail.com"},
  {
    $set: {lastActive: new Date()},
    $push: {
      loginHistory: {
        timestamp: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0"
      }
    }
  }
)
```

### Backup and Export
```javascript
// Export users collection
mongoexport --db shaadimantra_dev --collection users --out users_backup.json

// Export preapproved emails
mongoexport --db shaadimantra_dev --collection preapprovedemails --out preapprovedemails_backup.json

// Import data
mongoimport --db shaadimantra_dev --collection users --file users_backup.json
mongoimport --db shaadimantra_dev --collection preapprovedemails --file preapprovedemails_backup.json
```

---

## Quick Reference

### Common Commands
```javascript
// Switch database
use shaadimantra_dev

// Show current database
db

// Show collections
show collections

// Count documents
db.users.countDocuments()
db.preapprovedemails.countDocuments()

// Find one document
db.users.findOne()
db.preapprovedemails.findOne()

// Find all documents
db.users.find().pretty()
db.preapprovedemails.find().pretty()

// Drop collection
db.users.drop()
db.preapprovedemails.drop()
```

### Schema Validation
```javascript
// Check if user has required fields
db.users.find({
  $or: [
    {"profile.name": {$exists: false}},
    {"profile.email": {$exists: false}},
    {"userUuid": {$exists: false}}
  ]
})

// Check for invalid enum values
db.users.find({
  "profile.gender": {$nin: ["Male", "Female"]}
})

// Check for invalid marital status
db.users.find({
  "profile.maritalStatus": {$nin: ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"]}
})
```

---

## Notes

1. **UUID Generation**: Use `ObjectId().toString()` for generating UUIDs in MongoDB shell
2. **Date Fields**: Always use `new Date()` for timestamp fields
3. **Enum Values**: Ensure enum fields match the schema exactly
4. **Indexes**: Create indexes for better query performance
5. **Backup**: Regularly backup your data using mongoexport
6. **Validation**: Use schema validation queries to ensure data integrity

---

*Last Updated: July 2024*
*Version: 1.0* 