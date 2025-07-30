# Backblaze B2 Cloud Storage Integration

## 🎯 **Overview**

This document outlines the complete integration of Backblaze B2 Cloud Storage for efficient profile picture uploads in the Shaadi Mantra application. The implementation follows a cost-effective approach with one picture per user and automatic overwriting.

## 📋 **Key Features**

### ✅ **Efficient Upload Strategy:**
- **Image Compression**: Automatic resizing to 1080x1080 max
- **Format Optimization**: JPEG with 85% quality for optimal size
- **Metadata Stripping**: Removes EXIF data to reduce file size
- **One Picture Per User**: Overwrites existing images automatically

### ✅ **Cost Optimization:**
- **Minimal Storage**: Only one image per user stored
- **Bandwidth Efficiency**: Compressed images reduce transfer costs
- **Automatic Cleanup**: No orphaned files or duplicates
- **TTL Management**: Optional automatic deletion of old files

### ✅ **Security & Access:**
- **Private Bucket**: Secure access control
- **Signed URLs**: Time-limited access for profile pictures
- **Authentication Required**: All uploads require user authentication
- **Rate Limiting**: Prevents abuse and excessive uploads

## 🏗️ **Architecture**

### **Backend Components:**

#### **1. B2 Storage Service (`backend/src/services/b2StorageService.js`)**
```javascript
// Core B2 operations
- authorize() - Authenticate with B2
- processImage() - Optimize images with Sharp
- uploadProfilePicture() - Upload with overwrite
- deleteProfilePicture() - Remove user's image
- getSignedUrl() - Generate secure access URLs
- profilePictureExists() - Check if image exists
- getStorageStats() - Monitor usage and costs
```

#### **2. Upload Controller (`backend/src/controllers/uploadController.js`)**
```javascript
// API endpoints for B2 operations
- uploadProfilePicture() - Handle upload requests
- deleteProfilePicture() - Handle deletion requests
- getProfilePictureUrl() - Generate signed URLs
- getStorageStats() - Admin monitoring endpoint
```

#### **3. Upload Routes (`backend/src/routes/uploadRoutes.js`)**
```javascript
// RESTful endpoints
POST /api/upload/profile-picture - Upload profile picture
DELETE /api/upload/profile-picture - Delete profile picture
GET /api/upload/profile-picture/:userId/url - Get signed URL
GET /api/upload/storage/stats - Get storage statistics
```

### **Frontend Components:**

#### **1. Image Compression Utility (`frontend/src/utils/imageCompression.ts`)**
```typescript
// Client-side optimization
- compressProfilePicture() - Resize and compress images
- validateImage() - File validation
- formatFileSize() - Human-readable sizes
- createPreviewUrl() - Image previews
```

#### **2. Enhanced Upload Service (`frontend/src/services/image-upload-service.ts`)**
```typescript
// B2 integration methods
- uploadProfilePictureToB2() - Upload to B2 via backend
- deleteProfilePictureFromB2() - Remove from B2
- getProfilePictureUrl() - Get signed URLs
```

## 🔧 **Setup Instructions**

### **1. Backblaze B2 Account Setup**

#### **Create B2 Account:**
1. Sign up at [backblaze.com](https://www.backblaze.com)
2. Create a new application key
3. Create a private bucket for profile pictures

#### **Get Credentials:**
```bash
# Required environment variables
B2_KEY_ID=your_application_key_id
B2_APP_KEY=your_application_key
B2_BUCKET_ID=your_bucket_id
B2_BUCKET_NAME=your_bucket_name
```

### **2. Backend Dependencies**

#### **Install Required Packages:**
```bash
cd backend
npm install backblaze-b2 sharp
```

#### **Environment Configuration:**
```bash
# Add to .env file
B2_KEY_ID=your_application_key_id
B2_APP_KEY=your_application_key
B2_BUCKET_ID=your_bucket_id
B2_BUCKET_NAME=your_bucket_name
```

### **3. Frontend Setup**

#### **No Additional Dependencies Required:**
The frontend uses built-in browser APIs for image compression and the existing fetch API for uploads.

## 📊 **API Endpoints**

### **Upload Profile Picture**
```http
POST /api/upload/profile-picture
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: image file
```

**Response:**
```json
{
  "success": true,
  "message": "Profile picture uploaded successfully",
  "data": {
    "fileName": "profile_pictures/user123.jpg",
    "fileId": "4_z1234567890abcdef",
    "size": 245760,
    "sizeFormatted": "240 KB",
    "url": "https://f004.backblazeb2.com/file/bucket/profile_pictures/user123.jpg",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **Delete Profile Picture**
```http
DELETE /api/upload/profile-picture
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile picture deleted successfully"
}
```

### **Get Signed URL**
```http
GET /api/upload/profile-picture/:userId/url?expiry=3600
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://f004.backblazeb2.com/file/bucket/profile_pictures/user123.jpg?Authorization=...",
    "expiry": 3600,
    "userId": "user123"
  }
}
```

### **Get Storage Statistics (Admin Only)**
```http
GET /api/upload/storage/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 150,
    "totalSizeBytes": 36700160,
    "totalSizeMB": 35.0,
    "averageSizeBytes": 244667,
    "averageSizeKB": 239
  }
}
```

## 💰 **Cost Optimization**

### **Storage Costs:**
- **B2 Storage**: $0.005/GB/month
- **Example**: 1000 users × 240KB = 240MB = $0.0012/month

### **Bandwidth Costs:**
- **Download**: $0.01/GB
- **Upload**: Free
- **Example**: 1000 profile views/day × 240KB = 240MB/day = $0.0024/day

### **Optimization Strategies:**
1. **Image Compression**: 85% JPEG quality reduces size by ~60%
2. **One Picture Per User**: No duplicate storage
3. **Signed URLs**: Prevents hotlinking abuse
4. **Automatic Cleanup**: Removes orphaned files

## 🔒 **Security Considerations**

### **Access Control:**
- **Private Bucket**: No public access
- **Signed URLs**: Time-limited access (default: 1 hour)
- **Authentication Required**: All uploads require valid JWT
- **Rate Limiting**: Prevents upload abuse

### **Data Protection:**
- **No Metadata**: EXIF data stripped during processing
- **Secure URLs**: Signed URLs prevent unauthorized access
- **User Isolation**: Each user can only access their own images

## 🚀 **Usage Examples**

### **Frontend Upload:**
```typescript
import { ImageUploadService } from '../services/image-upload-service';

// Upload profile picture
const file = event.target.files[0];
const result = await ImageUploadService.uploadProfilePictureToB2(file);

if (result.success) {
  console.log('Upload successful:', result.imageUrl);
} else {
  console.error('Upload failed:', result.error);
}
```

### **Get Profile Picture URL:**
```typescript
// Get signed URL for profile picture
const userId = 'user123';
const signedUrl = await ImageUploadService.getProfilePictureUrl(userId, 3600);

if (signedUrl) {
  // Use signedUrl in img src
  document.getElementById('profile-pic').src = signedUrl;
}
```

### **Delete Profile Picture:**
```typescript
// Delete user's profile picture
const deleted = await ImageUploadService.deleteProfilePictureFromB2();

if (deleted) {
  console.log('Profile picture deleted successfully');
}
```

## 📈 **Monitoring & Analytics**

### **Storage Metrics:**
- **Total Files**: Number of profile pictures stored
- **Total Size**: Aggregate storage usage
- **Average Size**: Per-image storage efficiency
- **Cost Tracking**: Monthly storage and bandwidth costs

### **Performance Metrics:**
- **Upload Success Rate**: Percentage of successful uploads
- **Average Upload Time**: Time to process and upload images
- **Compression Ratio**: Size reduction achieved
- **Error Rates**: Failed uploads and reasons

## 🔧 **Configuration Options**

### **Image Processing:**
```javascript
// Backend processing options
const processingOptions = {
  maxWidth: 1080,
  maxHeight: 1080,
  quality: 85,
  format: 'jpeg',
  stripMetadata: true
};
```

### **URL Expiry:**
```javascript
// Signed URL expiry times
const expiryOptions = {
  short: 1800,    // 30 minutes
  default: 3600,  // 1 hour
  long: 7200      // 2 hours
};
```

### **Rate Limiting:**
```javascript
// Upload rate limits
const rateLimits = {
  maxUploadsPerHour: 10,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
};
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **1. Upload Failures:**
```bash
# Check B2 credentials
curl -u "keyId:applicationKey" https://api.backblazeb2.com/b2api/v2/b2_authorize_account
```

#### **2. Image Processing Errors:**
```bash
# Check Sharp installation
npm list sharp
# Reinstall if needed
npm rebuild sharp
```

#### **3. Authentication Issues:**
```bash
# Verify JWT token
curl -H "Authorization: Bearer <token>" http://localhost:5500/api/auth/profile
```

### **Debug Commands:**
```bash
# Test B2 connection
node -e "const B2 = require('backblaze-b2'); const b2 = new B2({applicationKeyId: process.env.B2_KEY_ID, applicationKey: process.env.B2_APP_KEY}); b2.authorize().then(() => console.log('B2 connected')).catch(console.error)"

# Check storage stats
curl -H "Authorization: Bearer <admin_token>" http://localhost:5500/api/upload/storage/stats
```

## 📚 **Additional Resources**

### **Documentation:**
- [Backblaze B2 API Documentation](https://www.backblaze.com/b2/docs/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Multer File Upload](https://github.com/expressjs/multer)

### **Best Practices:**
- **Regular Monitoring**: Check storage usage monthly
- **Backup Strategy**: Consider backing up critical images
- **Error Handling**: Implement graceful fallbacks
- **Performance Testing**: Monitor upload/download speeds

---

**🎉 B2 Cloud Storage Integration: READY FOR PRODUCTION!**

The integration provides a robust, cost-effective solution for profile picture storage with automatic optimization, security, and monitoring capabilities. 