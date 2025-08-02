# Toast Notifications - Shaadi Mantrana

Beautiful, animated toast notifications with brand-specific styling and smooth animations.

## 🎨 Features

- **Brand-Specific Design**: Beautiful gradients and colors matching Shaadi Mantrana
- **Smooth Animations**: Slide-in, scale, and rotation effects
- **Progress Bars**: Animated progress indicators for each toast type
- **Mobile Responsive**: Optimized for all screen sizes
- **Accessibility**: Support for reduced motion and high contrast
- **Type Safety**: Full TypeScript support

## 🚀 Quick Start

### Basic Usage

```typescript
import ToastService from '@/services/toastService';

// Success toast
ToastService.success('Profile saved successfully!');

// Error toast
ToastService.error('Something went wrong');

// Info toast
ToastService.info('Please check your email');
```

### Loading States

```typescript
// Show loading toast
const loadingId = ToastService.loading('Processing...');

// Dismiss loading and show success
setTimeout(() => {
  ToastService.dismiss(loadingId);
  ToastService.success('Completed!');
}, 3000);
```

## 📱 Toast Types

### Success Toasts

```typescript
// Basic success
ToastService.success('Operation completed!');

// Profile-specific
ToastService.profileSaved();
ToastService.profileComplete();
ToastService.loginSuccess();
ToastService.matchFound();
ToastService.messageSent();
```

### Error Toasts

```typescript
// Basic error
ToastService.error('Something went wrong');

// Specific errors
ToastService.validationError('email');
ToastService.networkError();
ToastService.uploadError();
ToastService.loginError();
```

### Info Toasts

```typescript
// Basic info
ToastService.info('Please check your email');

// Specific info
ToastService.profileIncomplete(87);
ToastService.processing();
ToastService.comingSoon();
```

### Loading Toasts

```typescript
// Generic loading
ToastService.loading('Processing your request...');

// Specific loading states
ToastService.uploading();
ToastService.saving();
ToastService.sendingOTP();
ToastService.verifying();
```

### Image Upload Flow

```typescript
// Complete upload flow
const uploadId = ToastService.uploading();
setTimeout(() => {
  ToastService.dismiss(uploadId);
  ToastService.imageUploadSuccess();
}, 2000);
```

### OTP Flow

```typescript
// Complete OTP verification flow
const otpId = ToastService.sendingOTP();
setTimeout(() => {
  ToastService.dismiss(otpId);
  const verifyId = ToastService.verifying();
  setTimeout(() => {
    ToastService.dismiss(verifyId);
    ToastService.loginSuccess();
  }, 2000);
}, 2000);
```

## 🎯 Brand-Specific Toasts

### Custom Brand Messages

```typescript
// Success brand message
ToastService.brandMessage('Welcome to Shaadi Mantrana!', 'success');

// Info brand message
ToastService.brandMessage('Finding your perfect match...', 'info');

// Error brand message
ToastService.brandMessage('Connection lost', 'error');
```

### Notification Toasts

```typescript
ToastService.newMessage();
ToastService.newLike();
ToastService.newView();
```

### Admin Actions

```typescript
ToastService.adminActionSuccess('User approval');
ToastService.adminActionError('delete user');
```

### Premium Features

```typescript
ToastService.premiumFeature();
ToastService.upgradeSuccess();
```

## 🎨 Visual Design

### Color Scheme

- **Default**: Pink gradient with subtle borders
- **Success**: Green gradient with emerald accents
- **Error**: Red gradient with warm tones
- **Loading**: Blue gradient with cyan highlights

### Animations

- **Entry**: Slide-in with scale and rotation effects
- **Hover**: Gentle lift and scale on hover
- **Exit**: Smooth slide-out animation
- **Progress**: Animated progress bars

### Typography

- **Font**: Inter (system fallback)
- **Weight**: Medium (500) for body text
- **Size**: 14px base size

## 📱 Mobile Responsive

Toasts automatically adapt to mobile screens:

- Reduced animation duration on mobile
- Optimized spacing and padding
- Touch-friendly interaction areas

## ♿ Accessibility

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .toast-animation {
    animation: none;
    transition: opacity 0.2s ease;
  }
}
```

### High Contrast

```css
@media (prefers-contrast: high) {
  .toast-animation {
    border-width: 2px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
```

## 🧪 Testing

Visit `/toast-demo` to see all toast types in action with beautiful animations.

## 📋 Best Practices

1. **Use Specific Methods**: Prefer specific toast methods over generic ones
2. **Manage Loading States**: Always dismiss loading toasts before showing results
3. **Consistent Messaging**: Use brand-specific messages when possible
4. **Appropriate Duration**: Longer duration for important messages
5. **Avoid Spam**: Don't show too many toasts at once

## 🔧 Customization

### Global Configuration

The Toaster component in `layout.tsx` controls global styling:

```typescript
<Toaster 
  position="top-center" 
  reverseOrder={false}
  toastOptions={{
    // Global styling options
    duration: 4000,
    style: {
      background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
      color: '#1f2937',
      borderRadius: '16px',
      // ... more styling
    },
    // Type-specific styling
    success: { /* ... */ },
    error: { /* ... */ },
    loading: { /* ... */ },
  }}
/>
```

### CSS Customization

Custom animations and styling are defined in `globals.css`:

```css
/* Toast animations */
.toast-animation {
  animation: toastSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Progress bars */
.toast-animation::before {
  animation: toastProgress 4s linear forwards;
}
```

## 🎉 Examples

### Profile Completion Flow

```typescript
const saveProfile = async () => {
  const savingId = ToastService.saving();
  
  try {
    await updateProfile(data);
    ToastService.dismiss(savingId);
    
    if (completion >= 100) {
      ToastService.profileComplete();
    } else {
      ToastService.profileIncomplete(completion);
    }
  } catch (error) {
    ToastService.dismiss(savingId);
    ToastService.error('Failed to save profile');
  }
};
```

### Login Flow

```typescript
const handleLogin = async () => {
  const otpId = ToastService.sendingOTP();
  
  try {
    await sendOTP(email);
    ToastService.dismiss(otpId);
    ToastService.success('OTP sent to your email!');
  } catch (error) {
    ToastService.dismiss(otpId);
    ToastService.loginError();
  }
};
```

### Image Upload

```typescript
const uploadImage = async (file) => {
  const uploadId = ToastService.uploading();
  
  try {
    await uploadToServer(file);
    ToastService.dismiss(uploadId);
    ToastService.imageUploadSuccess();
  } catch (error) {
    ToastService.dismiss(uploadId);
    ToastService.imageUploadError();
  }
};
```

---

**Note**: All toasts are automatically styled with beautiful animations and brand colors. The system is designed to provide a consistent, delightful user experience across the entire Shaadi Mantrana application. 