// Upload Routes
// Handles file upload endpoints

const express = require('express');
const router = express.Router();
const { uploadController } = require('../config/controllers');
const { authenticateToken } = require('../middleware/auth');

// Single file upload endpoint (requires authentication)
router.post('/single', uploadController.uploadSingle);

// Multiple files upload endpoint (requires authentication)
router.post('/multiple', uploadController.uploadMultiple);

// Get upload history (requires authentication)
router.get('/history', authenticateToken, uploadController.getUploads);

// Profile image upload endpoint (alias for single upload)
router.post('/profile-image', uploadController.uploadSingle);

module.exports = router;
