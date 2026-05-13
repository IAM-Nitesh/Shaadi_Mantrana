import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

export interface NativeVerificationResult {
  verificationId: string;
}

/**
 * Service to handle native Firebase Authentication via Capacitor.
 * This skips ReCAPTCHA and uses the native Android/iOS SDKs.
 * 
 * Note: Uses version 6.x API (addListener based flow).
 */
export const NativeAuthService = {
  /**
   * Sends an OTP to the given phone number using native SDK.
   */
  async signInWithPhone(phoneNumber: string): Promise<NativeVerificationResult | null> {
    if (!Capacitor.isNativePlatform()) return null;

    if (!FirebaseAuthentication) {
      console.error('NativeAuthService: FirebaseAuthentication plugin is missing');
      throw new Error('Native authentication plugin not available');
    }

    return new Promise((resolve, reject) => {
      let listenerHandle: PluginListenerHandle | null = null;

      const setupListener = async () => {
        listenerHandle = await FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
          if (listenerHandle) {
            listenerHandle.remove();
          }
          resolve({ verificationId: event.verificationId });
        });
      };

      setupListener().then(() => {
        FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber })
          .catch((error) => {
            if (listenerHandle) {
              listenerHandle.remove();
            }
            reject(error);
          });
      }).catch(reject);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (listenerHandle) {
          listenerHandle.remove();
          reject(new Error('NativeAuthService: Timeout waiting for phoneCodeSent'));
        }
      }, 30000);
    });
  },

  /**
   * Confirms the OTP code using native SDK.
   */
  async confirmCode(verificationId: string, verificationCode: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      // v6.x uses confirmVerificationCode instead of confirmPhoneNumberVerification
      await FirebaseAuthentication.confirmVerificationCode({
        verificationId,
        verificationCode,
      });
      return true;
    } catch (error) {
      console.error('NativeAuthService: Error confirming code', error);
      throw error;
    }
  },

  /**
   * Gets the current ID token from the native SDK.
   */
  async getIdToken(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) return null;

    try {
      const result = await FirebaseAuthentication.getIdToken();
      return result.token;
    } catch (error) {
      console.error('NativeAuthService: Error getting ID token', error);
      return null;
    }
  }
};
