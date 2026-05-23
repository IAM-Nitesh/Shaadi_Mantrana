const crypto = require('crypto');
const config = require('../config');

const allowedOrigins = new Set([
  config.FRONTEND_URL,
  config.APP_URL,
  process.env.FRONTEND_URL,
  process.env.APP_URL,
  'https://shaadimantrana.onrender.com',
  'https://shaadimantrana.app',
  'https://www.shaadimantrana.app'
].filter(Boolean));

function createCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}

function isSafeOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  return Array.from(allowedOrigins).some(allowed => origin.startsWith(allowed));
}

function ensureCsrfCookie(req, res, next) {
  if (!req.cookies || !req.cookies._csrf) {
    const isProduction = process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
    res.cookie('_csrf', createCsrfToken(), {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });
  }
  next();
}

function validateCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const isCookieAuthenticated = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken || req.cookies?.sessionId);
  if (!isCookieAuthenticated) {
    return next();
  }

  const csrfHeader = req.get('x-csrf-token');
  const csrfCookie = req.cookies?._csrf;
  if (csrfHeader && csrfCookie && csrfHeader === csrfCookie) {
    return next();
  }

  const origin = req.get('origin') || req.get('referer');
  if (isSafeOrigin(origin)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Invalid CSRF token or origin. Request blocked.'
  });
}

module.exports = {
  ensureCsrfCookie,
  validateCsrf
};
