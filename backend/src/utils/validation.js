// Production-Ready Validation Utilities
// Implements comprehensive input validation with detailed error messages

const { ValidationError } = require('./errors');

class ValidationUtils {
  // Email validation with detailed error messages
  static validateEmail(email, fieldName = 'email') {
    if (!email) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    
    if (typeof email !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }
    
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      throw new ValidationError(`${fieldName} format is invalid`, fieldName, email);
    }
    
    if (email.length > 254) {
      throw new ValidationError(`${fieldName} is too long (max 254 characters)`, fieldName);
    }
    
    if (email.startsWith('.') || email.endsWith('.')) {
      throw new ValidationError(`${fieldName} cannot start or end with a dot`, fieldName);
    }
    
    if (email.includes('..')) {
      throw new ValidationError(`${fieldName} cannot contain consecutive dots`, fieldName);
    }
    
    return email.toLowerCase().trim();
  }
  
  // String validation with customizable rules
  static validateString(value, fieldName, options = {}) {
    const {
      required = false,
      minLength = 0,
      maxLength = Infinity,
      allowEmpty = true,
      trim = true,
      pattern = null,
      patternMessage = 'Invalid format'
    } = options;
    
    if (required && (!value || value === '')) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    
    if (!value && !required) {
      return allowEmpty ? '' : null;
    }
    
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }
    
    const processedValue = trim ? value.trim() : value;
    
    if (processedValue.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName);
    }
    
    if (processedValue.length > maxLength) {
      throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`, fieldName);
    }
    
    if (pattern && !pattern.test(processedValue)) {
      throw new ValidationError(`${fieldName} ${patternMessage}`, fieldName, processedValue);
    }
    
    return processedValue;
  }
  
  // Number validation
  static validateNumber(value, fieldName, options = {}) {
    const {
      required = false,
      min = -Infinity,
      max = Infinity,
      integer = false
    } = options;
    
    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    
    if (value === undefined || value === null) {
      return null;
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
    }
    
    if (integer && !Number.isInteger(numValue)) {
      throw new ValidationError(`${fieldName} must be an integer`, fieldName, value);
    }
    
    if (numValue < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName, value);
    }
    
    if (numValue > max) {
      throw new ValidationError(`${fieldName} must be at most ${max}`, fieldName, value);
    }
    
    return numValue;
  }
  
  // Array validation
  static validateArray(value, fieldName, options = {}) {
    const {
      required = false,
      minLength = 0,
      maxLength = Infinity,
      itemValidator = null
    } = options;
    
    if (required && (!value || !Array.isArray(value))) {
      throw new ValidationError(`${fieldName} is required and must be an array`, fieldName);
    }
    
    if (!value) {
      return [];
    }
    
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`, fieldName);
    }
    
    if (value.length < minLength) {
      throw new ValidationError(`${fieldName} must have at least ${minLength} items`, fieldName);
    }
    
    if (value.length > maxLength) {
      throw new ValidationError(`${fieldName} must have at most ${maxLength} items`, fieldName);
    }
    
    if (itemValidator) {
      return value.map((item, index) => itemValidator(item, `${fieldName}[${index}]`));
    }
    
    return value;
  }
  
  // Enum validation
  static validateEnum(value, fieldName, allowedValues, required = false) {
    if (required && (!value || value === '')) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    
    if (!value) {
      return null;
    }
    
    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`,
        fieldName,
        value
      );
    }
    
    return value;
  }
  
  // Age validation (specific for matrimonial app)
  static validateAge(age, fieldName = 'age') {
    return this.validateNumber(age, fieldName, {
      required: false,
      min: 18,
      max: 80,
      integer: true
    });
  }
  
  // Interest validation
  static validateInterests(interests, fieldName = 'interests') {
    const validatedInterests = this.validateArray(interests, fieldName, {
      required: false,
      maxLength: 10
    });
    
    return validatedInterests.map(interest => 
      this.validateString(interest, 'interest', {
        maxLength: 50,
        trim: true
      })
    ).filter(interest => interest.length > 0);
  }
  
  // Profile image validation
  static validateImages(images, fieldName = 'images') {
    const validatedImages = this.validateArray(images, fieldName, {
      required: false,
      maxLength: 5
    });
    
    return validatedImages.map(image => 
      this.validateString(image, 'image', {
        maxLength: 500,
        trim: true,
        pattern: /^(https?:\/\/|\/uploads\/)/,
        patternMessage: 'must be a valid URL or upload path'
      })
    ).filter(image => image.length > 0);
  }
  
  // JWT token validation
  static validateJWTToken(token, fieldName = 'token') {
    const validatedToken = this.validateString(token, fieldName, {
      required: true,
      minLength: 10
    });
    
    // Basic JWT format check
    const parts = validatedToken.split('.');
    if (parts.length !== 3) {
      throw new ValidationError(`${fieldName} is not a valid JWT format`, fieldName);
    }
    
    return validatedToken;
  }
  
  // UUID validation
  static validateUUID(uuid, fieldName = 'uuid') {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    const validatedUuid = this.validateString(uuid, fieldName, {
      required: true,
      pattern: uuidPattern,
      patternMessage: 'must be a valid UUID'
    });
    
    return validatedUuid;
  }
  
  // Sanitize input for XSS prevention
  static sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove XSS characters
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }
  
  // Validate pagination parameters
  static validatePagination(page, limit) {
    const validPage = this.validateNumber(page, 'page', {
      required: false,
      min: 1,
      integer: true
    }) || 1;
    
    const validLimit = this.validateNumber(limit, 'limit', {
      required: false,
      min: 1,
      max: 100,
      integer: true
    }) || 10;
    
    return { page: validPage, limit: validLimit };
  }
}

module.exports = ValidationUtils;
