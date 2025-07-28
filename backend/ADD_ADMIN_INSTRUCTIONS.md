# Adding Admin Email Instructions

To add the admin email `codebynitesh@gmail.com` to the database, follow these steps:

## Option 1: Using npm script (Recommended)
```bash
cd backend
npm run db:add-admin-simple
```

## Option 2: Direct node execution
```bash
cd backend
node scripts/simple-add-admin.js
```

## Option 3: Manual MongoDB commands
If the scripts don't work, you can run these MongoDB commands directly:

### Connect to MongoDB:
```bash
mongosh "mongodb+srv://shaadimantrauser_dev:z2CNxqEaEel3tVNw@cluster0-m0freetier.hdkszsj.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0-M0freeTier"
```

### Add to preapproved collection:
```javascript
db.preapprovedemails.insertOne({
  email: 'codebynitesh@gmail.com',
  uuid: 'admin-uuid-' + Date.now(),
  approvedByAdmin: true,
  addedAt: new Date()
})
```

### Add to users collection:
```javascript
db.users.insertOne({
  email: 'codebynitesh@gmail.com',
  userUuid: 'admin-uuid-' + Date.now(),
  role: 'admin',
  status: 'active',
  isFirstLogin: true,
  profile: {
    location: "India",
    profileCompleteness: 17
  },
  preferences: {
    location: ["Andhra Pradesh", "Bihar", "Delhi"]
  },
  createdAt: new Date()
})
```

## Verification
After adding the admin email, you can verify it was added correctly:

```bash
cd backend
npm run db:check
```

The admin email should now be able to:
1. Send OTP and login to the application
2. Access the admin dashboard
3. Manage other users and invitations

## Troubleshooting
If you encounter any issues:
1. Make sure the backend server is running
2. Check that MongoDB is accessible
3. Verify the email format is correct
4. Try the manual MongoDB commands if scripts fail 