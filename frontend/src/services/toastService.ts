import toast from 'react-hot-toast';

class ToastService {
  // Success Toasts
  static success(message: string) {
    return toast.success(message, {
      id: `success-${Date.now()}`,
    });
  }

  static profileSaved() {
    return toast.success('✨ Profile saved successfully!', {
      id: 'profile-saved',
    });
  }

  static profileComplete() {
    return toast.success('🎉 Profile 100% complete! You can now use all features.', {
      id: 'profile-complete',
      duration: 6000,
    });
  }

  static loginSuccess() {
    return toast.success('🎊 Welcome to Shaadi Mantrana!', {
      id: 'login-success',
    });
  }

  static matchFound() {
    return toast.success('💕 New match found! Check your matches.', {
      id: 'match-found',
      duration: 5000,
    });
  }

  static messageSent() {
    return toast.success('💬 Message sent successfully!', {
      id: 'message-sent',
    });
  }

  // Error Toasts
  static error(message: string) {
    return toast.error(message, {
      id: `error-${Date.now()}`,
    });
  }

  static validationError(field: string) {
    return toast.error(`Please check your ${field} information.`, {
      id: `validation-${field}`,
    });
  }

  static networkError() {
    return toast.error('🌐 Network error. Please check your connection.', {
      id: 'network-error',
      duration: 6000,
    });
  }

  static uploadError() {
    return toast.error('📸 Image upload failed. Please try again.', {
      id: 'upload-error',
    });
  }

  static loginError() {
    return toast.error('🔐 Login failed. Please check your credentials.', {
      id: 'login-error',
    });
  }

  // Info Toasts
  static info(message: string) {
    return toast(message, {
      id: `info-${Date.now()}`,
    });
  }

  static profileIncomplete(percentage: number) {
    return toast(`📝 Profile ${percentage}% complete. Add more details to unlock all features.`, {
      id: 'profile-incomplete',
      duration: 5000,
    });
  }

  static processing() {
    return toast('⏳ Processing your request...', {
      id: 'processing',
    });
  }

  static comingSoon() {
    return toast('🚀 This feature is coming soon!', {
      id: 'coming-soon',
    });
  }

  // Loading Toasts
  static loading(message: string) {
    return toast.loading(message, {
      id: `loading-${Date.now()}`,
    });
  }

  static uploading() {
    return toast.loading('📤 Uploading image...', {
      id: 'uploading',
    });
  }

  static saving() {
    return toast.loading('💾 Saving your profile...', {
      id: 'saving',
    });
  }

  static sendingOTP() {
    return toast.loading('📱 Sending verification code...', {
      id: 'sending-otp',
    });
  }

  static verifying() {
    return toast.loading('🔍 Verifying your code...', {
      id: 'verifying',
    });
  }

  // Dismiss Toasts
  static dismiss(toastId?: string) {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }

  // Image Upload Specific Toasts
  static imageUploadSuccess() {
    return toast.success('📸 Profile picture updated successfully!', {
      id: 'image-upload-success',
      duration: 4000,
    });
  }

  static imageUploadError() {
    return toast.error('📸 Failed to update profile picture. Please try again.', {
      id: 'image-upload-error',
    });
  }

  // Admin Specific Toasts
  static adminActionSuccess(action: string) {
    return toast.success(`✅ ${action} completed successfully!`, {
      id: `admin-${action}`,
    });
  }

  static adminActionError(action: string) {
    return toast.error(`❌ Failed to ${action}. Please try again.`, {
      id: `admin-${action}-error`,
    });
  }

  // Premium Features Toasts
  static premiumFeature() {
    return toast('⭐ This is a premium feature. Upgrade to unlock!', {
      id: 'premium-feature',
      duration: 5000,
    });
  }

  static upgradeSuccess() {
    return toast.success('🌟 Welcome to Premium! Enjoy exclusive features.', {
      id: 'upgrade-success',
      duration: 6000,
    });
  }

  // Welcome and Onboarding Toasts
  static welcomeBack() {
    return toast.success('👋 Welcome back to Shaadi Mantrana!', {
      id: 'welcome-back',
    });
  }

  static firstTimeUser() {
    return toast('🎯 Complete your profile to start finding your perfect match!', {
      id: 'first-time-user',
      duration: 6000,
    });
  }

  // Notification Toasts
  static newMessage() {
    return toast.success('💌 You have a new message!', {
      id: 'new-message',
      duration: 4000,
    });
  }

  static newLike() {
    return toast.success('💖 Someone liked your profile!', {
      id: 'new-like',
      duration: 4000,
    });
  }

  static newView() {
    return toast('👀 Someone viewed your profile!', {
      id: 'new-view',
      duration: 3000,
    });
  }

  // Custom Brand Toasts
  static brandMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const emoji = type === 'success' ? '💕' : type === 'error' ? '💔' : '💭';
    const toastMethod = type === 'success' ? toast.success : type === 'error' ? toast.error : toast;
    
    return toastMethod(`${emoji} ${message}`, {
      id: `brand-${type}-${Date.now()}`,
    });
  }
}

export default ToastService; 