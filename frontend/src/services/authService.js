import { config as configService } from './configService';
import { apiClient } from '../utils/api-client';

export const sendOTP = async (email) => {
  try {
    const response = await apiClient.post('/api/auth/send-otp', { email }, {
      credentials: 'include',
      timeout: 15000
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to send OTP');
    }
    return await response.json();
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await apiClient.post('/api/auth/verify-otp', { email, otp }, {
      credentials: 'include',
      timeout: 15000
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to verify OTP');
    }
    return await response.json();
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};