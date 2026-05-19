// Test: Admin can create user with phone number
const request = require('supertest');
const app = require('../index'); // Assuming express app exported from index.js
const { User, Invitation } = require('../models');

// Admin auth token (mock - replace with real test token)
const adminToken = process.env.TEST_ADMIN_TOKEN || 'mock-admin-token';

describe('Admin User Creation - Phone Number Support', () => {
  
  beforeEach(async () => {
    // Clear test users before each test
    await User.deleteMany({ 
      userUuid: { $regex: '^test-' } 
    });
  });

  test('Should create user with phone number only (no email)', async () => {
    const res = await request(app)
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        phoneNumber: '+919876543210'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.phoneNumber).toBe('+919876543210');
    expect(res.body.user.email).toBeUndefined(); // Email should not be present
    expect(res.body.user.status).toBe('invited');
  });

  test('Should create user with email and phone number', async () => {
    const res = await request(app)
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        phoneNumber: '+919876543210',
        email: 'test@example.com'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.phoneNumber).toBe('+919876543210');
    expect(res.body.user.status).toBe('invited');
  });

  test('Should reject invalid phone number format', async () => {
    const res = await request(app)
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        phoneNumber: 'invalid-phone'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('phone');
  });

  test('Should reject duplicate phone number', async () => {
    // Create first user
    const res1 = await request(app)
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        phoneNumber: '+919876543210'
      });
    
    expect(res1.status).toBe(201);

    // Try to create second user with same phone
    const res2 = await request(app)
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        phoneNumber: '+919876543210'
      });

    expect(res2.status).toBe(409);
    expect(res2.body.error).toContain('phone');
  });

  test('Should reject request with neither phone nor email', async () => {
    const res = await request(app)
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('phone|email|required');
  });

});
