// Shared Security utilities
// Used across controllers for validation and security

const SecurityUtils = {
  // Get client IP from request
  getClientIP: (req) => {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.ip || 
           'unknown';
  },

  // Validate email format
  validateEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    
    // Comprehensive email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Check basic format
    if (!emailRegex.test(email)) return false;
    
    // Additional validations
    if (email.length > 254) return false; // RFC 5321 limit
    if (email.startsWith('.') || email.endsWith('.')) return false;
    if (email.includes('..')) return false; // Double dots not allowed
    
    return true;
  },
  
  // Sanitize input
  sanitizeInput: (input) => {
    if (!input || typeof input !== 'string') return '';
    
    // Remove dangerous characters and normalize
    return input
      .trim()
      .toLowerCase()
      .replace(/[<>\"'&]/g, '') // Remove XSS characters
      .substring(0, 255); // Limit length
  },
  
  // Basic encryption (for demo purposes - use proper encryption in production)
  encrypt: (text) => {
    try {
      return Buffer.from(text).toString('base64');
    } catch (error) {
      throw new Error('Encryption failed');
    }
  },
  
  // Basic decryption (for demo purposes - use proper encryption in production)
  decrypt: (encrypted) => {
    try {
      return Buffer.from(encrypted, 'base64').toString('ascii');
    } catch (error) {
      throw new Error('Decryption failed');
    }
  },

  // Rate limiting
  rateLimitStore: new Map(),
  
  checkRateLimit: (key, limit, windowMs, identifier = 'default') => {
    const now = Date.now();
    const fullKey = `${identifier}-${key}`;
    
    if (!SecurityUtils.rateLimitStore.has(fullKey)) {
      SecurityUtils.rateLimitStore.set(fullKey, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: limit - 1 };
    }
    
    const record = SecurityUtils.rateLimitStore.get(fullKey);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return { allowed: true, remaining: limit - 1 };
    }
    
    if (record.count >= limit) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: record.resetTime,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      };
    }
    
    record.count++;
    return { allowed: true, remaining: limit - record.count };
  },

  // Clean up expired rate limit entries
  cleanupRateLimit: () => {
    const now = Date.now();
    for (const [key, record] of SecurityUtils.rateLimitStore.entries()) {
      if (now > record.resetTime) {
        SecurityUtils.rateLimitStore.delete(key);
      }
    }
  }
};

// Clean up rate limiting data every 5 minutes
setInterval(SecurityUtils.cleanupRateLimit, 5 * 60 * 1000);

module.exports = { SecurityUtils };
