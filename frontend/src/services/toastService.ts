import toast, { Toast, ToastOptions } from 'react-hot-toast';

class ToastService {
  // Helper to add swipeable class to all toasts
  private static addSwipeableClass(options?: ToastOptions): ToastOptions {
    return {
      duration: 5000, // Default duration
      className: `${options?.className || ''} swipeable-toast`.trim(),
      ...options,
    };
  }

  // Success Toasts
  static success(message: string, options?: ToastOptions ) {
    return toast.success(message, this.addSwipeableClass({
      id: `success-${Date.now()}`,
      ...options,
    }));
  }



  static profileComplete() {
    return toast.success('🎉 Profile 100% complete! You can now use all features.', this.addSwipeableClass({
      id: 'profile-complete',
      duration: 6000,
    }));
  }

  static loginSuccess() {
    return toast.success('🎊 Welcome to Shaadi Mantrana!', this.addSwipeableClass({
      id: 'login-success',
    }));
  }

  static matchFound() {
    return toast.success('💕 New match found! Check your matches.', this.addSwipeableClass({
      id: 'match-found',
      duration: 5000,
    }));
  }

  static messageSent() {
    return toast.success('💬 Message sent successfully!', this.addSwipeableClass({
      id: 'message-sent',
    }));
  }

  // Error Toasts
  static error(message: string, options?: ToastOptions) {
    return toast.error(message, this.addSwipeableClass({
      id: `error-${Date.now()}`,
      ...options,
    }));
  }

  static validationError(field: string) {
    return toast.error(
      `Please check your ${field} information.`,
      this.addSwipeableClass({
        id: `validation-${field}`,
      })
    );
  }

  static networkError() {
    return toast.error('🌐 Network error. Please check your connection.', this.addSwipeableClass({
      id: 'network-error',
      duration: 6000,
    }));
  }

  static uploadError() {
    return toast.error('📸 Image upload failed. Please try again.', this.addSwipeableClass({
      id: 'upload-error',
    }));
  }

  static loginError() {
    return toast.error('🔐 Login failed. Please check your credentials.', this.addSwipeableClass({
      id: 'login-error',
    }));
  }

  // Info Toasts
  static info(message: string, options?: ToastOptions) {
    return toast(message, this.addSwipeableClass({
      id: `info-${Date.now()}`,
      duration: 3000, // Info messages have shorter duration by default
      ...options,
    }));
  }

  static profileIncomplete(percentage: number) {
    return toast(`📝 Profile ${percentage}% complete. Add more details to unlock all features.`, this.addSwipeableClass({
      id: 'profile-incomplete',
      duration: 5000,
    }));
  }

  static processing() {
    return toast('⏳ Processing your request...', this.addSwipeableClass({
      id: 'processing',
    }));
  }

  static comingSoon() {
    return toast('🚀 This feature is coming soon!', this.addSwipeableClass({
      id: 'coming-soon',
    }));
  }

  // Loading Toasts
  static loading(message: string, options?: ToastOptions) {
    return toast.loading(message, this.addSwipeableClass({
      ...options,
      id: `loading-${Date.now()}`,
    }));
  }

  static uploading() {
    return toast.loading('📤 Uploading image...', this.addSwipeableClass({
      id: 'uploading',
    }));
  }

  static saving() {
    return toast.loading('💾 Saving your profile...', this.addSwipeableClass({
      id: 'saving',
    }));
  }

  static sendingOTP() {
    return toast.loading('📱 Sending verification code...', this.addSwipeableClass({
      id: 'sending-otp',
    }));
  }

  static verifying() {
    return toast.loading('🔍 Verifying your code...', this.addSwipeableClass({
      id: 'verifying',
    }));
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
    return toast.success('📸 Profile picture uploaded successfully!', this.addSwipeableClass({
      id: 'image-upload-success',
      duration: 3000,
    }));
  }

  static imageUploadError() {
    return toast.error('📸 Failed to update profile picture. Please try again.', this.addSwipeableClass({
      id: 'image-upload-error',
    }));
  }

  // Profile Action Specific Toasts
  static profilePictureUploaded() {
    return toast.success('📸 Profile picture uploaded successfully!', this.addSwipeableClass({
      id: 'profile-picture-uploaded',
      duration: 3000,
    }));
  }

  static profileSaved() {
    return toast.success('🎉 Profile saved successfully! You can now use Discover and Matches.', this.addSwipeableClass({
      id: 'profile-saved',
      duration: 4000,
    }));
  }

  static profilePictureVerificationPending() {
    return toast.success('Your profile picture is being verified. It will be visible once approved.', this.addSwipeableClass({
      id: 'profile-picture-verification-pending',
      duration: 5000,
    }));
  }

  // Admin Specific Toasts
  static adminActionSuccess(action: string) {
    return toast.success(`✅ ${action} completed successfully!`, this.addSwipeableClass({
      id: `admin-${action}`,
    }));
  }

  static adminActionError(action: string) {
    return toast.error(`❌ Failed to ${action}. Please try again.`, this.addSwipeableClass({
      id: `admin-${action}-error`,
    }));
  }

  // Premium Features Toasts
  static premiumFeature() {
    return toast('⭐ This is a premium feature. Upgrade to unlock!', this.addSwipeableClass({
      id: 'premium-feature',
      duration: 5000,
    }));
  }

  static upgradeSuccess() {
    return toast.success('🌟 Welcome to Premium! Enjoy exclusive features.', this.addSwipeableClass({
      id: 'upgrade-success',
      duration: 6000,
    }));
  }

  // Welcome and Onboarding Toasts
  static welcomeBack() {
    return toast.success('👋 Welcome back to Shaadi Mantrana!', this.addSwipeableClass({
      id: 'welcome-back',
    }));
  }

  static firstTimeUser() {
    return toast('🎯 Complete your profile to start finding your perfect match!', this.addSwipeableClass({
      id: 'first-time-user',
      duration: 6000,
    }));
  }

  // Notification Toasts
  static newMessage() {
    return toast.success('💌 You have a new message!', this.addSwipeableClass({
      id: 'new-message',
      duration: 4000,
    }));
  }

  static newLike() {
    return toast.success('💖 Someone liked your profile!', this.addSwipeableClass({
      id: 'new-like',
      duration: 4000,
    }));
  }

  static newView() {
    return toast('👀 Someone viewed your profile!', this.addSwipeableClass({
      id: 'new-view',
      duration: 3000,
    }));
  }

  // Custom Brand Toasts
  static brandMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const emoji = type === 'success' ? '💕' : type === 'error' ? '💔' : '💭';
    const toastMethod = type === 'success' ? toast.success : type === 'error' ? toast.error : toast;
    
    return toastMethod(`${emoji} ${message}`, this.addSwipeableClass({
      id: `brand-${type}-${Date.now()}`,
    }));
  }
}

export default ToastService; 