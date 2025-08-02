const B2 = require('backblaze-b2');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

class B2StorageService {
  constructor() {
    this.b2 = new B2({
      applicationKeyId: process.env.B2_KEY_ID,
      applicationKey: process.env.B2_APP_KEY
    });
    
    this.bucketId = process.env.B2_BUCKET_ID;
    this.bucketName = process.env.B2_BUCKET_NAME;
    this.isAuthorized = false;
  }

  /**
   * Authorize with B2
   */
  async authorize() {
    if (this.isAuthorized) {
      console.log('✅ B2 already authorized');
      return;
    }
    
    try {
      console.log('🔍 Authorizing with B2...');
      await this.b2.authorize();
      this.isAuthorized = true;
      console.log('✅ B2 authorization successful');
    } catch (error) {
      console.error('❌ B2 authorization failed:', error.message);
      throw new Error('B2 authorization failed');
    }
  }

  /**
   * Process and optimize image for upload
   * @param {Buffer} imageBuffer - Raw image buffer
   * @param {string} userId - User ID for filename
   * @returns {Promise<Buffer>} - Optimized image buffer
   */
  async processImage(imageBuffer, userId) {
    try {
      // Process image with Sharp - enhanced quality settings for sharper images
      const processedImage = await sharp(imageBuffer)
        .resize(1200, 1200, { // Increased from 1000 for better quality
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: 95, // Increased from 85 to 95 for better quality
          progressive: true,
          mozjpeg: true,
          chromaSubsampling: '4:4:4' // Enhanced from 4:2:0 for better color quality
        })
        .toBuffer();

      console.log(`✅ Image processed for user ${userId}: ${imageBuffer.length} -> ${processedImage.length} bytes`);
      return processedImage;
    } catch (error) {
      console.error('❌ Image processing failed:', error.message);
      throw new Error('Image processing failed');
    }
  }

  /**
   * Upload profile picture to B2 (overwrites existing)
   * @param {Buffer} imageBuffer - Processed image buffer
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Upload result with file info
   */
  async uploadProfilePicture(imageBuffer, userId) {
    const startTime = Date.now();
    try {
      console.log(`🔄 Starting B2 upload for user ${userId}...`);
      
      await this.authorize();
      const authTime = Date.now() - startTime;
      console.log(`⏱️ Authorization time: ${authTime}ms`);

      // Process image for optimal storage
      const processStart = Date.now();
      const processedImage = await this.processImage(imageBuffer, userId);
      const processTime = Date.now() - processStart;
      console.log(`⏱️ Image processing time: ${processTime}ms`);
      
      // Use userId-based filename (auto-overwrites previous versions)
      const fileName = `profile_pictures/${userId}.jpg`;
      
      // Get upload URL
      const urlStart = Date.now();
      const { data: uploadUrlData } = await this.b2.getUploadUrl({
        bucketId: this.bucketId
      });
      const urlTime = Date.now() - urlStart;
      console.log(`⏱️ Get upload URL time: ${urlTime}ms`);

      // Upload file
      const uploadStart = Date.now();
      const uploadResult = await this.b2.uploadFile({
        uploadUrl: uploadUrlData.uploadUrl,
        uploadAuthToken: uploadUrlData.authorizationToken,
        fileName: fileName,
        data: processedImage,
        contentType: 'image/jpeg',
        contentLength: processedImage.length
      });
      const uploadTime = Date.now() - uploadStart;
      console.log(`⏱️ File upload time: ${uploadTime}ms`);

      const totalTime = Date.now() - startTime;
      console.log(`✅ Profile picture uploaded for user ${userId}: ${uploadResult.data.fileName} (Total time: ${totalTime}ms)`);

      return {
        success: true,
        fileName: uploadResult.data.fileName,
        fileId: uploadResult.data.fileId,
        size: processedImage.length,
        url: this.getPublicUrl(fileName)
      };

    } catch (error) {
      console.error('❌ Profile picture upload failed:', error.message);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete profile picture from B2
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteProfilePicture(userId) {
    try {
      await this.authorize();

      // Use userId-based filename
      const fileName = `profile_pictures/${userId}.jpg`;

      // First, get file info to get fileId
      const { data: files } = await this.b2.listFileNames({
        bucketId: this.bucketId,
        prefix: fileName,
        maxFileCount: 1
      });

      if (files.files.length === 0) {
        console.log(`ℹ️ No profile picture found for user ${userId}`);
        return true;
      }

      const fileId = files.files[0].fileId;

      // Delete file
      await this.b2.deleteFileVersion({
        fileId: fileId,
        fileName: fileName
      });

      console.log(`✅ Profile picture deleted for user ${userId}: ${fileName}`);
      return true;

    } catch (error) {
      console.error('❌ Profile picture deletion failed:', error.message);
      throw new Error(`Deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate signed URL for private access
   * @param {string} userId - User ID
   * @param {number} expirySeconds - URL expiry time in seconds (default: 1 hour)
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(userId, expirySeconds = 3600) {
    try {
      console.log(`🔍 Generating signed URL for user: ${userId}, expiry: ${expirySeconds}s`);
      await this.authorize();

      // Use userId-based filename
      const fileName = `profile_pictures/${userId}.jpg`;
      console.log(`🔍 File name: ${fileName}`);

      // Get download authorization
      console.log(`🔍 Getting download authorization for bucket: ${this.bucketId}`);
      const { data: authData } = await this.b2.getDownloadAuthorization({
        bucketId: this.bucketId,
        fileNamePrefix: 'profile_pictures/',
        validDurationInSeconds: expirySeconds
      });

      // Construct the signed URL using the correct B2 format
      // B2 signed URLs use the format: https://f003.backblazeb2.com/file/bucket-name/file-name?Authorization=token
      const signedUrl = `https://f003.backblazeb2.com/file/${this.bucketName}/${fileName}?Authorization=${authData.authorizationToken}`;
      console.log(`✅ Signed URL generated: ${signedUrl}`);

      return signedUrl;
    } catch (error) {
      console.error('❌ Signed URL generation failed:', error.message);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  /**
   * Get public URL (if bucket is public)
   * @param {string} fileName - File name
   * @returns {string} - Public URL
   */
  getPublicUrl(fileName) {
    // Use the correct B2 endpoint based on the bucket region
    // For eu-central-003 region, use f003.backblazeb2.com
    return `https://f003.backblazeb2.com/file/${this.bucketName}/${fileName}`;
  }

  /**
   * Check if profile picture exists
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Existence status
   */
  async profilePictureExists(userId) {
    try {
      console.log(`🔍 Checking if profile picture exists for user: ${userId}`);
      await this.authorize();

      // Use userId-based filename
      const fileName = `profile_pictures/${userId}.jpg`;
      console.log(`🔍 Looking for file: ${fileName}`);

      const { data: files } = await this.b2.listFileNames({
        bucketId: this.bucketId,
        prefix: fileName,
        maxFileCount: 1
      });

      console.log(`🔍 Found ${files.files.length} files`);
      const exists = files.files.length > 0;
      console.log(`🔍 Profile picture exists: ${exists}`);
      return exists;
    } catch (error) {
      console.error('❌ Profile picture existence check failed:', error.message);
      return false;
    }
  }

  /**
   * Get profile picture info
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - File info or null
   */
  async getProfilePictureInfo(userId) {
    try {
      await this.authorize();

      // Use userId-based filename
      const fileName = `profile_pictures/${userId}.jpg`;

      const { data: files } = await this.b2.listFileNames({
        bucketId: this.bucketId,
        prefix: fileName,
        maxFileCount: 1
      });

      if (files.files.length === 0) {
        return null;
      }

      const file = files.files[0];
      return {
        fileName: file.fileName,
        fileId: file.fileId,
        size: file.contentLength,
        uploadTimestamp: file.uploadTimestamp,
        url: this.getPublicUrl(fileName)
      };
    } catch (error) {
      console.error('❌ Profile picture info retrieval failed:', error.message);
      return null;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<Object>} - Storage stats
   */
  async getStorageStats() {
    try {
      await this.authorize();

      const { data: files } = await this.b2.listFileNames({
        bucketId: this.bucketId,
        prefix: 'profile_pictures/'
      });

      const totalFiles = files.files.length;
      const totalSize = files.files.reduce((sum, file) => sum + file.contentLength, 0);
      const averageSize = totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0;

      return {
        totalFiles,
        totalSizeBytes: totalSize,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        averageSizeBytes: averageSize,
        averageSizeKB: Math.round(averageSize / 1024)
      };
    } catch (error) {
      console.error('❌ Storage stats retrieval failed:', error.message);
      throw new Error(`Storage stats retrieval failed: ${error.message}`);
    }
  }
}

module.exports = B2StorageService; 