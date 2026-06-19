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

  async confirmCode(verificationId: string, verificationCode: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      // v6.x uses confirmVerificationCode instead of confirmPhoneNumberVerification
      await FirebaseAuthentication.confirmVerificationCode({
        verificationId,
        verificationCode,
      });
      return true;
    } catch (error: any) {
      // Handle Android auto-retrieval race condition:
      // If Firebase automatically verified the SMS in the background, the verificationId
      // is consumed. If the user then manually types the SMS and clicks verify, Firebase
      // throws "The sms code has expired" because the ID is already used.
      // We check if the user is ALREADY signed in to bypass this safely.
      try {
        const currentUserResult = await FirebaseAuthentication.getCurrentUser();
        if (currentUserResult && currentUserResult.user) {
          console.log('NativeAuthService: confirmVerificationCode threw, but user is already signed in via auto-retrieval. Ignoring error.');
          return true;
        }
      } catch (checkErr) {
        // Ignore errors checking user state
      }

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
