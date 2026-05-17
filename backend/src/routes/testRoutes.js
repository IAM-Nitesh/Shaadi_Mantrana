/**
 * ⚠️ TEST ENVIRONMENT ONLY.
 * Creates a backend session for a seeded test persona, bypassing Firebase auth.
 * Tests the business logic layer (AuthGuard, routes, guards) — not the auth layer.
 * The Firebase OTP flow has its own separate test track using the Firebase emulator.
 * 
 * SECURITY:
 * 1. Only registered when NODE_ENV=test or development.
 * 2. Strict IP check (Localhost only).
 * 3. 404 Stealth Mode for non-local requests.
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWTSessionManager } = require('../middleware/auth');
const appConfig = require('../config');

router.post('/session', async (req, res) => {
  // 1. IP Guard (Action 12.2) - Localhost Only
  const ip = req.ip || req.connection.remoteAddress;
  const allowedIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  
  if (!allowedIps.includes(ip)) {
    console.warn(`⚠️ Blocked external attempt to test session endpoint from IP: ${ip}`);
    return res.status(404).end(); // Stealth mode
  }

  // 2. Env Guard (Action 12.1)
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).end();
  }

  try {
    const { persona } = req.body;
    if (!persona) return res.status(400).json({ error: 'Persona is required' });

    // Master Brain: Direct In-Process Seeding (Non-blocking)
    const PERSONA_CONFIGS = {
      admin: {
        firebaseUid: 'mock_firebase_uid_admin',
        phoneNumber: '9898989898',
        email: 'admin.test@shaadimantrana.com',
        role: 'admin',
        isApprovedByAdmin: true,
        isFirstLogin: false,
        hasCompletedWizard: true,
        profile: { name: 'Test Admin', profileCompleteness: 100 }
      },
      fresh: {
        firebaseUid: 'mock_firebase_uid_fresh',
        phoneNumber: '9999999999',
        email: 'fresh.test@shaadimantrana.com',
        role: 'user',
        isApprovedByAdmin: true,
        isFirstLogin: true,
        hasCompletedWizard: false,
        profile: { name: 'Fresh User', profileCompleteness: 0 }
      },
      incomplete: {
        firebaseUid: 'mock_firebase_uid_incomplete',
        phoneNumber: '9354799303',
        email: 'incomplete.test@shaadimantrana.com',
        role: 'user',
        isApprovedByAdmin: true,
        isFirstLogin: false,
        hasCompletedWizard: false,
        profile: { name: 'Incomplete User', profileCompleteness: 60 }
      },
      complete: {
        firebaseUid: 'mock_firebase_uid_complete',
        phoneNumber: '9876543210',
        email: 'complete.test@shaadimantrana.com',
        role: 'user',
        isApprovedByAdmin: true,
        isFirstLogin: false,
        hasCompletedWizard: true,
        profile: { name: 'Complete User A', profileCompleteness: 100 }
      }
    };

    const config = PERSONA_CONFIGS[persona.toLowerCase()];
    if (!config) return res.status(400).json({ error: `Unknown persona: ${persona}` });

    // Seed/Update User
    const updatedUser = await User.findOneAndUpdate(
      { phoneNumber: config.phoneNumber },
      { ...config, verified: true, status: 'active', isTestData: true },
      { upsert: true, new: true, runValidators: false }
    );

    // Create Official Session
    const session = await JWTSessionManager.createSession(updatedUser);

    // Set Cookie
    res.cookie('accessToken', session.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: 'localhost'
    });

    res.json({ 
      success: true, 
      persona, 
      user: {
        ...updatedUser.toPublicJSON(),
        profileCompleteness: updatedUser.profile?.profileCompleteness || 0
      },
      token: session.accessToken // Explicitly return for curl verification
    });
  } catch (error) {
    console.error('❌ Test session injection error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
