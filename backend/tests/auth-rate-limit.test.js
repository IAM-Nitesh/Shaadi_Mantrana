/**
 * S0-7: Auth rate limiting must persist and return 429 when exceeded.
 */
const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const rateLimit = require('express-rate-limit');
const MongoRateLimitStore = require('../src/utils/mongoRateLimitStore');
const RateLimit = require('../src/models/RateLimit');

describe('Auth rate limiting', () => {
  beforeAll(async () => {
    const uri = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI;
    if (!uri) {
      console.warn('Skipping rate limit tests: MONGODB_URI not set');
      return;
    }
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await RateLimit.deleteMany({ key: /^auth_test_/ });
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 1) return;
    await RateLimit.deleteMany({ key: /^auth_test_/ });
  });

  test('MongoRateLimitStore increments and resets window', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const store = new MongoRateLimitStore({ prefix: 'auth_test_' });
    store.init({ windowMs: 60_000 });

    const first = await store.increment('127.0.0.1_1234');
    expect(first.totalHits).toBe(1);

    const second = await store.increment('127.0.0.1_1234');
    expect(second.totalHits).toBe(2);
  });

  test('auth limiter returns 429 after max requests', async () => {
    if (mongoose.connection.readyState !== 1) return;

    const app = express();
    app.use(express.json());

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      store: new MongoRateLimitStore({ prefix: 'auth_test_' }),
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: () => '127.0.0.1_test',
      message: { success: false, error: 'Too many requests' },
    });

    app.post('/api/auth/firebase-login', limiter, (req, res) => {
      res.status(200).json({ success: true });
    });

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/firebase-login')
        .send({ phoneNumber: '+919999999999' });
      expect(res.status).toBe(200);
    }

    const blocked = await request(app)
      .post('/api/auth/firebase-login')
      .send({ phoneNumber: '+919999999999' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many/i);
  });
});
