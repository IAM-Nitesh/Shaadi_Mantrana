// Upload Routes
// Handles file upload endpoints

const express = require('express');
const router = express.Router();
const { uploadController } = require('../config/controllers');
const { authenticateToken } = require('../middleware/auth');

// Debug route to test multer
router.post('/test-upload', authenticateToken, uploadController.uploadMemory.single('image'), (req, res) => {
  console.log('🔍 Test upload route called');
  console.log('📁 req.file:', req.file);
  console.log('📋 req.body:', req.body);
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file provided in test route',
      code: 'NO_FILE_PROVIDED'
    });
  }
  
  res.json({
    success: true,
    message: 'File received successfully',
    file: {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? 'Buffer present' : 'No buffer'
    }
  });
});

// Single file upload endpoint (requires authentication)
router.post('/single', authenticateToken, uploadController.uploadSingle);

// Multiple files upload endpoint (requires authentication)
router.post('/multiple', authenticateToken, uploadController.uploadMultiple);

// Get upload history (requires authentication)
router.get('/history', authenticateToken, uploadController.getUploads);

// Profile image upload endpoint (alias for single upload)
router.post('/profile-image', authenticateToken, uploadController.uploadSingle);

// B2 Cloud Storage profile picture endpoints
router.post('/profile-picture', authenticateToken, (req, res, next) => {
  console.log('🔍 Profile picture upload route called');
  console.log('📋 req.headers:', req.headers);
  console.log('📋 req.body keys:', Object.keys(req.body || {}));
  
  // Apply multer middleware
  uploadController.uploadMemory.single('image')(req, res, (err) => {
    if (err) {
      console.log('❌ Multer error:', err);
      return res.status(400).json({
        success: false,
        message: err.message,
        code: 'MULTER_ERROR'
      });
    }
    
    console.log('✅ Multer middleware applied successfully');
    console.log('📁 req.file after multer:', req.file);
    next();
  });
}, uploadController.uploadProfilePicture);
router.delete('/profile-picture', authenticateToken, uploadController.deleteProfilePicture);
router.get('/profile-picture/:userId/url', uploadController.getProfilePictureUrl);
router.get('/profile-picture/url', authenticateToken, uploadController.getMyProfilePictureUrl);
router.get('/storage/stats', authenticateToken, uploadController.getStorageStats);

module.exports = router;
