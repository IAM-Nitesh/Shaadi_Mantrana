// Test: Admin can create user with phone number
// This is a unit test for phone validation logic
const { User } = require('../src/models');
const mongoose = require('mongoose');

// Phone validation regex (same as in adminRoutes.js)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

describe('Admin User Creation - Phone Number Support', () => {
  
  afterAll(async () => {
    // Close database connection after all tests
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.disconnect();
      } catch (e) {
        // ignore
      }
    }
  });

  describe('Phone Number Validation', () => {
    test('Should accept valid E.164 format with country code', () => {
      expect(phoneRegex.test('+919876543210')).toBe(true);
    });

    test('Should accept valid E.164 format without + prefix', () => {
      expect(phoneRegex.test('919876543210')).toBe(true);
    });

    test('Should reject invalid format with letters', () => {
      expect(phoneRegex.test('invalid-phone')).toBe(false);
    });

    test('Should reject phone starting with 0', () => {
      expect(phoneRegex.test('+0123456789')).toBe(false);
    });

    test('Should reject empty phone', () => {
      expect(phoneRegex.test('')).toBe(false);
    });

    test('Should accept UK number', () => {
      expect(phoneRegex.test('+441234567890')).toBe(true);
    });

    test('Should accept US number', () => {
      expect(phoneRegex.test('+12125551234')).toBe(true);
    });
  });

  describe('User Schema Phone Field', () => {
    test('User schema should have phoneNumber field', () => {
      const userSchema = User.schema;
      expect(userSchema.paths.phoneNumber).toBeDefined();
    });

    test('Phone field should be unique', () => {
      const userSchema = User.schema;
      expect(userSchema.paths.phoneNumber.options.unique).toBe(true);
    });

    test('Phone field should be sparse', () => {
      const userSchema = User.schema;
      expect(userSchema.paths.phoneNumber.options.sparse).toBe(true);
    });

    test('Should create user with phone number', async () => {
      const user = new User({
        phoneNumber: '+919876543210',
        role: 'user',
        status: 'invited'
      });

      const validationError = user.validateSync();
      expect(validationError).toBeUndefined();
    });

    test('Should create user without phone number (sparse allows null)', async () => {
      const user = new User({
        email: 'test@example.com',
        role: 'user',
        status: 'invited'
      });

      const validationError = user.validateSync();
      expect(validationError).toBeUndefined();
    });
  });
});
