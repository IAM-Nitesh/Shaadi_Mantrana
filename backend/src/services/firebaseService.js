const admin = require('firebase-admin');
const logger = require('../utils/logger');

/**
 * Firebase Admin Service
 * Handles verification of Firebase ID Tokens and Phone Auth
 */

const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      return admin.app();
    }

    const firebaseAdminConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (firebaseAdminConfig.projectId && firebaseAdminConfig.clientEmail && firebaseAdminConfig.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseAdminConfig),
      });
      logger.info('✅ Firebase Admin initialized successfully');
      return admin;
    } else {
      logger.warn('⚠️ Firebase Admin not initialized: Missing environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
      return null;
    }
  } catch (error) {
    logger.error('❌ Error initializing Firebase Admin:', error);
    return null;
  }
};

const firebaseApp = initializeFirebase();

/**
 * Verify a Firebase ID Token
 * @param {string} idToken - The token sent from the client
 * @returns {Promise<Object>} - The decoded token
 */
const verifyIdToken = async (idToken) => {
  // --- Playwright/E2E Test Bypass ---
  // Allow a mock token in development to facilitate stable E2E testing
  if (process.env.NODE_ENV !== 'production' && idToken === 'mock-token') {
    logger.info('FirebaseService: Bypassing token verification for E2E test token');
    const testPhone = process.env.E2E_TEST_PHONE_NUMBER || '0000000000';
    return {
      uid: 'playwright-test-user',
      phone_number: `+91${testPhone}`,
      email: `test-${testPhone}@shaadimantrana.com`,
      name: 'Playwright Test User'
    };
  }

  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.auth().verifyIdToken(idToken);
};

module.exports = {
  admin,
  verifyIdToken,
  firebaseApp
};
