// Enhanced Upload Controller with Comprehensive Edge Case Handling
// Handles file upload operations with security and validation

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { SecurityUtils } = require('../utils/security');

// Enhanced validation utilities for uploads
const UploadValidationUtils = {
  // Validate file type
  validateFileType: (file) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    if (!file || !file.originalname) {
      return { valid: false, error: 'No file provided' };
    }
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype?.toLowerCase();
    
    if (!allowedMimeTypes.includes(mimeType)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`
      };
    }
    
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`
      };
    }
    
    // Check for potential security issues
    const suspiciousPatterns = [
      /\.php/i,
      /\.asp/i,
      /\.jsp/i,
      /\.exe/i,
      /\.bat/i,
      /\.cmd/i,
      /\.sh/i,
      /script/i
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(file.originalname) || pattern.test(mimeType)
    );
    
    if (isSuspicious) {
      return {
        valid: false,
        error: 'File appears to contain suspicious content'
      };
    }
    
    return {
      valid: true,
      mimeType,
      extension: fileExtension,
      originalName: file.originalname
    };
  },

  // Validate file size
  validateFileSize: (file, maxSizeBytes = 5 * 1024 * 1024) => { // 5MB default
    if (!file || file.size === undefined) {
      return { valid: false, error: 'File size information missing' };
    }
    
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }
    
    if (file.size > maxSizeBytes) {
      const maxSizeMB = maxSizeBytes / (1024 * 1024);
      const fileSizeMB = file.size / (1024 * 1024);
      return {
        valid: false,
        error: `File too large. Max: ${maxSizeMB}MB, Got: ${fileSizeMB.toFixed(2)}MB`
      };
    }
    
    return {
      valid: true,
      size: file.size,
      sizeFormatted: UploadValidationUtils.formatFileSize(file.size)
    };
  },

  // Validate upload category
  validateUploadCategory: (category) => {
    const allowedCategories = ['profile', 'gallery', 'document', 'verification'];
    
    if (!category) {
      return { valid: false, error: 'Upload category is required' };
    }
    
    if (typeof category !== 'string') {
      return { valid: false, error: 'Category must be a string' };
    }
    
    const lowerCategory = category.toLowerCase().trim();
    
    if (!allowedCategories.includes(lowerCategory)) {
      return {
        valid: false,
        error: `Invalid category. Allowed: ${allowedCategories.join(', ')}`
      };
    }
    
    return {
      valid: true,
      category: lowerCategory
    };
  },

  // Format file size for display
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Generate secure filename
  generateSecureFilename: (originalFilename, userId) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename).toLowerCase();
    const baseName = path.basename(originalFilename, extension)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 20);
    
    return `${baseName}-${userId}-${timestamp}-${randomString}${extension}`;
  },

  // Validate file content (basic checks)
  validateFileContent: async (filePath) => {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size === 0) {
        return { valid: false, error: 'File is empty after upload' };
      }
      
      // Read first few bytes to check for valid image headers
      const buffer = Buffer.alloc(10);
      const fileHandle = await fs.open(filePath, 'r');
      await fileHandle.read(buffer, 0, 10, 0);
      await fileHandle.close();
      
      // Check for common image file signatures
      const signatures = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47],
        gif: [0x47, 0x49, 0x46],
        webp: [0x52, 0x49, 0x46, 0x46] // "RIFF"
      };
      
      let isValidImage = false;
      for (const [format, signature] of Object.entries(signatures)) {
        const matches = signature.every((byte, index) => buffer[index] === byte);
        if (matches) {
          isValidImage = true;
          break;
        }
      }
      
      if (!isValidImage) {
        return { valid: false, error: 'File does not appear to be a valid image' };
      }
      
      return {
        valid: true,
        fileSize: stats.size,
        isImage: true
      };
      
    } catch (error) {
      return {
        valid: false,
        error: `File validation failed: ${error.message}`
      };
    }
  }
};

// Rate limiting for uploads
const uploadRateLimit = new Map();

const checkUploadRateLimit = (userId, clientIP) => {
  const now = Date.now();
  const userKey = `user:${userId}`;
  const ipKey = `ip:${clientIP}`;
  
  // Check user-based rate limiting (max 20 uploads per hour per user)
  const userLimits = uploadRateLimit.get(userKey) || [];
  const recentUserUploads = userLimits.filter(time => now - time < 60 * 60 * 1000);
  
  if (recentUserUploads.length >= 20) {
    return {
      allowed: false,
      error: 'Too many uploads. Please wait before uploading more files.',
      retryAfter: Math.ceil((recentUserUploads[0] + 60 * 60 * 1000 - now) / 1000)
    };
  }
  
  // Check IP-based rate limiting (max 100 uploads per hour per IP)
  const ipLimits = uploadRateLimit.get(ipKey) || [];
  const recentIPUploads = ipLimits.filter(time => now - time < 60 * 60 * 1000);
  
  if (recentIPUploads.length >= 100) {
    return {
      allowed: false,
      error: 'Too many uploads from this IP address. Please wait before uploading more files.',
      retryAfter: Math.ceil((recentIPUploads[0] + 60 * 60 * 1000 - now) / 1000)
    };
  }
  
  // Update rate limits
  recentUserUploads.push(now);
  recentIPUploads.push(now);
  uploadRateLimit.set(userKey, recentUserUploads);
  uploadRateLimit.set(ipKey, recentIPUploads);
  
  return { allowed: true };
};

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  
  for (const [key, times] of uploadRateLimit.entries()) {
    const recentTimes = times.filter(time => time > hourAgo);
    if (recentTimes.length === 0) {
      uploadRateLimit.delete(key);
    } else {
      uploadRateLimit.set(key, recentTimes);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

// Upload tracking for cleanup and management
const uploadRecords = [];

// Configure multer with enhanced security
const createMulterStorage = () => {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const category = req.body.category || 'profile';
        const uploadDir = path.join(__dirname, '../../uploads', category);
        
        // Ensure directory exists
        await fs.mkdir(uploadDir, { recursive: true });
        
        cb(null, uploadDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      try {
        const userId = req.user?.userId || req.user?.email?.split('@')[0] || 'anonymous';
        const secureFilename = UploadValidationUtils.generateSecureFilename(file.originalname, userId);
        cb(null, secureFilename);
      } catch (error) {
        cb(error);
      }
    }
  });
};

const upload = multer({
  storage: createMulterStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5, // Max 5 files per request
    fieldNameSize: 100,
    fieldSize: 1024,
    fields: 10
  },
  fileFilter: (req, file, cb) => {
    const validation = UploadValidationUtils.validateFileType(file);
    if (!validation.valid) {
      cb(new Error(validation.error), false);
    } else {
      cb(null, true);
    }
  }
});

// Enhanced Upload Controller
const uploadController = {
  // Upload single file with comprehensive validation
  uploadSingle: [
    // Middleware to check authentication
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }
      next();
    },
    
    // Multer middleware
    upload.single('file'),
    
    // Main handler
    async (req, res) => {
      const startTime = Date.now();
      
      try {
        // Get client IP for rate limiting
        const clientIP = SecurityUtils.getClientIP(req);
        const userId = req.user?.userId || req.user?.email?.split('@')[0] || 'anonymous';

        // Check rate limiting
        const rateLimitCheck = checkUploadRateLimit(userId, clientIP);
        if (!rateLimitCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: rateLimitCheck.error,
            code: 'RATE_LIMITED',
            retryAfter: rateLimitCheck.retryAfter
          });
        }

        // Check if file was provided
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No file provided',
            code: 'NO_FILE'
          });
        }

        // Validate file type
        const typeValidation = UploadValidationUtils.validateFileType(req.file);
        if (!typeValidation.valid) {
          // Clean up uploaded file
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            console.error('❌ Error cleaning up invalid file:', cleanupError);
          }
          
          return res.status(400).json({
            success: false,
            error: typeValidation.error,
            code: 'INVALID_FILE_TYPE'
          });
        }

        // Validate file size
        const sizeValidation = UploadValidationUtils.validateFileSize(req.file);
        if (!sizeValidation.valid) {
          // Clean up uploaded file
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            console.error('❌ Error cleaning up oversized file:', cleanupError);
          }
          
          return res.status(400).json({
            success: false,
            error: sizeValidation.error,
            code: 'INVALID_FILE_SIZE'
          });
        }

        // Validate category
        const categoryValidation = UploadValidationUtils.validateUploadCategory(req.body.category);
        if (!categoryValidation.valid) {
          // Clean up uploaded file
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            console.error('❌ Error cleaning up file with invalid category:', cleanupError);
          }
          
          return res.status(400).json({
            success: false,
            error: categoryValidation.error,
            code: 'INVALID_CATEGORY'
          });
        }

        // Validate file content
        const contentValidation = await UploadValidationUtils.validateFileContent(req.file.path);
        if (!contentValidation.valid) {
          // Clean up uploaded file
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            console.error('❌ Error cleaning up invalid content file:', cleanupError);
          }
          
          return res.status(400).json({
            success: false,
            error: contentValidation.error,
            code: 'INVALID_FILE_CONTENT'
          });
        }

        // Create upload record
        const uploadRecord = {
          id: crypto.randomUUID(),
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          sizeFormatted: sizeValidation.sizeFormatted,
          category: categoryValidation.category,
          path: req.file.path,
          url: `/api/uploads/${categoryValidation.category}/${req.file.filename}`,
          uploadedBy: req.user.email,
          uploadedAt: new Date().toISOString(),
          clientIP: clientIP,
          userAgent: req.headers['user-agent']?.substring(0, 200) || 'Unknown',
          metadata: {
            validation: {
              type: typeValidation,
              size: sizeValidation,
              content: contentValidation
            }
          }
        };

        // Add to upload records
        uploadRecords.push(uploadRecord);

        const processingTime = Date.now() - startTime;

        console.log(`✅ File uploaded successfully: ${req.file.filename} by ${req.user.email}`);

        res.status(201).json({
          success: true,
          message: 'File uploaded successfully',
          file: {
            id: uploadRecord.id,
            filename: uploadRecord.filename,
            originalName: uploadRecord.originalName,
            size: uploadRecord.size,
            sizeFormatted: uploadRecord.sizeFormatted,
            mimeType: uploadRecord.mimeType,
            category: uploadRecord.category,
            url: uploadRecord.url,
            uploadedAt: uploadRecord.uploadedAt
          },
          metadata: {
            processingTime: `${processingTime}ms`,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('❌ Error uploading file:', error);
        
        // Clean up file if it exists
        if (req.file?.path) {
          try {
            await fs.unlink(req.file.path);
          } catch (cleanupError) {
            console.error('❌ Error cleaning up file after error:', cleanupError);
          }
        }
        
        const processingTime = Date.now() - startTime;
        
        res.status(500).json({
          success: false,
          message: 'Failed to upload file',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          code: 'UPLOAD_ERROR',
          processingTime: `${processingTime}ms`
        });
      }
    }
  ],

  // Upload multiple files
  uploadMultiple: [
    // Middleware to check authentication
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }
      next();
    },
    
    // Multer middleware for multiple files
    upload.array('files', 5), // Max 5 files
    
    // Main handler
    async (req, res) => {
      const startTime = Date.now();
      
      try {
        // Get client IP for rate limiting
        const clientIP = SecurityUtils.getClientIP(req);
        const userId = req.user?.userId || req.user?.email?.split('@')[0] || 'anonymous';

        // Check rate limiting
        const rateLimitCheck = checkUploadRateLimit(userId, clientIP);
        if (!rateLimitCheck.allowed) {
          // Clean up any uploaded files
          if (req.files && req.files.length > 0) {
            for (const file of req.files) {
              try {
                await fs.unlink(file.path);
              } catch (cleanupError) {
                console.error('❌ Error cleaning up file:', cleanupError);
              }
            }
          }
          
          return res.status(429).json({
            success: false,
            error: rateLimitCheck.error,
            code: 'RATE_LIMITED',
            retryAfter: rateLimitCheck.retryAfter
          });
        }

        // Check if files were provided
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No files provided',
            code: 'NO_FILES'
          });
        }

        // Validate category
        const categoryValidation = UploadValidationUtils.validateUploadCategory(req.body.category);
        if (!categoryValidation.valid) {
          // Clean up uploaded files
          for (const file of req.files) {
            try {
              await fs.unlink(file.path);
            } catch (cleanupError) {
              console.error('❌ Error cleaning up file:', cleanupError);
            }
          }
          
          return res.status(400).json({
            success: false,
            error: categoryValidation.error,
            code: 'INVALID_CATEGORY'
          });
        }

        const uploadedFiles = [];
        const errors = [];

        // Process each file
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          
          try {
            // Validate file type
            const typeValidation = UploadValidationUtils.validateFileType(file);
            if (!typeValidation.valid) {
              errors.push({ file: file.originalname, error: typeValidation.error });
              await fs.unlink(file.path);
              continue;
            }

            // Validate file size
            const sizeValidation = UploadValidationUtils.validateFileSize(file);
            if (!sizeValidation.valid) {
              errors.push({ file: file.originalname, error: sizeValidation.error });
              await fs.unlink(file.path);
              continue;
            }

            // Validate file content
            const contentValidation = await UploadValidationUtils.validateFileContent(file.path);
            if (!contentValidation.valid) {
              errors.push({ file: file.originalname, error: contentValidation.error });
              await fs.unlink(file.path);
              continue;
            }

            // Create upload record
            const uploadRecord = {
              id: crypto.randomUUID(),
              filename: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              sizeFormatted: sizeValidation.sizeFormatted,
              category: categoryValidation.category,
              path: file.path,
              url: `/api/uploads/${categoryValidation.category}/${file.filename}`,
              uploadedBy: req.user.email,
              uploadedAt: new Date().toISOString(),
              clientIP: clientIP,
              userAgent: req.headers['user-agent']?.substring(0, 200) || 'Unknown'
            };

            uploadRecords.push(uploadRecord);
            uploadedFiles.push({
              id: uploadRecord.id,
              filename: uploadRecord.filename,
              originalName: uploadRecord.originalName,
              size: uploadRecord.size,
              sizeFormatted: uploadRecord.sizeFormatted,
              mimeType: uploadRecord.mimeType,
              category: uploadRecord.category,
              url: uploadRecord.url,
              uploadedAt: uploadRecord.uploadedAt
            });

          } catch (error) {
            errors.push({ file: file.originalname, error: error.message });
            try {
              await fs.unlink(file.path);
            } catch (cleanupError) {
              console.error('❌ Error cleaning up file:', cleanupError);
            }
          }
        }

        const processingTime = Date.now() - startTime;

        console.log(`✅ ${uploadedFiles.length} files uploaded successfully by ${req.user.email}`);

        res.status(uploadedFiles.length > 0 ? 201 : 400).json({
          success: uploadedFiles.length > 0,
          message: `${uploadedFiles.length} files uploaded successfully`,
          files: uploadedFiles,
          errors: errors.length > 0 ? errors : undefined,
          statistics: {
            total: req.files.length,
            successful: uploadedFiles.length,
            failed: errors.length
          },
          metadata: {
            processingTime: `${processingTime}ms`,
            timestamp: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error('❌ Error uploading files:', error);
        
        // Clean up files if they exist
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            try {
              await fs.unlink(file.path);
            } catch (cleanupError) {
              console.error('❌ Error cleaning up file after error:', cleanupError);
            }
          }
        }
        
        const processingTime = Date.now() - startTime;
        
        res.status(500).json({
          success: false,
          message: 'Failed to upload files',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          code: 'UPLOAD_MULTIPLE_ERROR',
          processingTime: `${processingTime}ms`
        });
      }
    }
  ],

  // Get upload history
  async getUploads(req, res) {
    const startTime = Date.now();
    
    try {
      // Authentication is required
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'NO_AUTH'
        });
      }

      const {
        page = 1,
        limit = 20,
        category = '',
        sortBy = 'uploadedAt',
        sortOrder = 'desc'
      } = req.query;

      // Validate pagination
      const pageNum = Math.max(1, Math.min(1000, parseInt(page) || 1));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

      // Filter uploads by user
      let userUploads = uploadRecords.filter(upload => upload.uploadedBy === req.user.email);

      // Apply category filter
      if (category && category.trim() !== '') {
        const categoryFilter = category.toLowerCase().trim();
        userUploads = userUploads.filter(upload => upload.category === categoryFilter);
      }

      // Apply sorting
      userUploads.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'uploadedAt':
            comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'filename':
            comparison = a.filename.localeCompare(b.filename);
            break;
          case 'originalName':
            comparison = a.originalName.localeCompare(b.originalName);
            break;
          default:
            comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        }
        
        return sortOrder.toLowerCase() === 'desc' ? -comparison : comparison;
      });

      // Apply pagination
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedUploads = userUploads.slice(startIndex, endIndex);

      // Remove sensitive information
      const publicUploads = paginatedUploads.map(upload => ({
        id: upload.id,
        filename: upload.filename,
        originalName: upload.originalName,
        size: upload.size,
        sizeFormatted: upload.sizeFormatted,
        mimeType: upload.mimeType,
        category: upload.category,
        url: upload.url,
        uploadedAt: upload.uploadedAt
      }));

      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        uploads: publicUploads,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(userUploads.length / limitNum),
          totalUploads: userUploads.length,
          hasNextPage: endIndex < userUploads.length,
          hasPrevPage: pageNum > 1,
          pageSize: limitNum
        },
        statistics: {
          totalSize: userUploads.reduce((sum, upload) => sum + upload.size, 0),
          totalSizeFormatted: UploadValidationUtils.formatFileSize(userUploads.reduce((sum, upload) => sum + upload.size, 0)),
          byCategory: userUploads.reduce((acc, upload) => {
            acc[upload.category] = (acc[upload.category] || 0) + 1;
            return acc;
          }, {})
        },
        metadata: {
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error fetching uploads:', error);
      const processingTime = Date.now() - startTime;
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch uploads',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        code: 'FETCH_UPLOADS_ERROR',
        processingTime: `${processingTime}ms`
      });
    }
  }
};

module.exports = uploadController;
