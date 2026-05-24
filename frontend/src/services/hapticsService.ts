import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

class HapticsService {
  private static isAvailable = Capacitor.isNativePlatform();

  static async impactLight() {
    if (!this.isAvailable) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.error('Haptics error', e);
    }
  }

  static async impactMedium() {
    if (!this.isAvailable) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.error('Haptics error', e);
    }
  }

  static async impactHeavy() {
    if (!this.isAvailable) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {
      console.error('Haptics error', e);
    }
  }

  static async selection() {
    if (!this.isAvailable) return;
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch (e) {
      console.error('Haptics error', e);
    }
  }

  static async success() {
    if (!this.isAvailable) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.error('Haptics error', e);
    }
  }

  static async warning() {
    if (!this.isAvailable) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (e) {
      console.error('Haptics error', e);
    }
  }

  static async error() {
    if (!this.isAvailable) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (e) {
      console.error('Haptics error', e);
    }
  }
}

export default HapticsService;
