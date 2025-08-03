// Security utilities for the frontend application

// Input validation and sanitization
export class SecurityUtils {
  // XSS Prevention - Sanitize HTML content
  static sanitizeHTML(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number (basic validation)
  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // Validate password strength
  static validatePassword(password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score < 2) {
      issues.push('Password must contain at least 2 character types');
    }

    let strength: 'weak' | 'medium' | 'strong';
    if (score < 3) strength = 'weak';
    else if (score < 4) strength = 'medium';
    else strength = 'strong';

    return {
      isValid: issues.length === 0,
      strength,
      issues,
    };
  }

  // Sanitize user input for safe display
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate file upload
  static validateFileUpload(file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    maxFiles?: number;
  } = {}): { isValid: boolean; error?: string } {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxFiles = 1 } = options;

    if (file.size > maxSize) {
      return { isValid: false, error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: `File type ${file.type} is not allowed` };
    }

    return { isValid: true };
  }

  // Generate secure random string
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash sensitive data (client-side, for basic protection)
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Rate limiting utility
  static createRateLimiter(maxRequests: number, timeWindow: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the time window
      const validRequests = userRequests.filter(time => now - time < timeWindow);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true; // Request allowed
    };
  }

  // CSRF token management
  static generateCSRFToken(): string {
    return this.generateSecureToken(32);
  }

  // Validate CSRF token
  static validateCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken;
  }

  // Content Security Policy headers
  static getCSPHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://api.shaadimantra.com",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }
}

// Secure storage utilities
export class SecureStorage {
  private static readonly PREFIX = 'sm_secure_';
  private static readonly ENCRYPTION_KEY = 'your-encryption-key'; // In production, use environment variable

  // Store sensitive data with basic encryption
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = await SecurityUtils.hashData(value);
      localStorage.setItem(this.PREFIX + key, encryptedValue);
    } catch (error) {
      console.error('Failed to store secure item:', error);
    }
  }

  // Retrieve sensitive data
  static getSecureItem(key: string): string | null {
    try {
      return localStorage.getItem(this.PREFIX + key);
    } catch (error) {
      console.error('Failed to retrieve secure item:', error);
      return null;
    }
  }

  // Remove sensitive data
  static removeSecureItem(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.error('Failed to remove secure item:', error);
    }
  }

  // Clear all secure data
  static clearSecureData(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear secure data:', error);
    }
  }
}

// Security middleware for API calls
export class SecurityMiddleware {
  private static rateLimiter = SecurityUtils.createRateLimiter(100, 60000); // 100 requests per minute

  // Add security headers to API requests
  static addSecurityHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const csrfToken = SecurityUtils.generateCSRFToken();
    
    return {
      ...headers,
      'X-CSRF-Token': csrfToken,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
    };
  }

  // Validate API response for security issues
  static validateResponse(response: Response): boolean {
    // Check for suspicious headers
    const suspiciousHeaders = ['x-powered-by', 'server'];
    for (const header of suspiciousHeaders) {
      if (response.headers.get(header)) {
        console.warn(`Suspicious header detected: ${header}`);
        return false;
      }
    }

    // Check response status
    if (response.status >= 400) {
      console.error(`API error: ${response.status}`);
      return false;
    }

    return true;
  }

  // Rate limiting for API calls
  static checkRateLimit(identifier: string): boolean {
    return this.rateLimiter(identifier);
  }
}

// Security hooks for React components
export function useSecurity() {
  const validateInput = (input: string, type: 'email' | 'phone' | 'password' | 'general'): boolean => {
    switch (type) {
      case 'email':
        return SecurityUtils.validateEmail(input);
      case 'phone':
        return SecurityUtils.validatePhone(input);
      case 'password':
        return SecurityUtils.validatePassword(input).isValid;
      case 'general':
        return input.length > 0 && input.length < 1000;
      default:
        return false;
    }
  };

  const sanitizeInput = (input: string): string => {
    return SecurityUtils.sanitizeInput(input);
  };

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    return SecurityUtils.validateFileUpload(file);
  };

  return {
    validateInput,
    sanitizeInput,
    validateFile,
  };
} 