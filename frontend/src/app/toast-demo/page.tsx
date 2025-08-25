'use client';

import { useState } from 'react';
import ToastService from '../../services/toastService';

export default function ToastDemoPage() {
  const [isLoading, setIsLoading] = useState(false);

  const showSuccessToasts = () => {
    ToastService.success('This is a success message!');
    setTimeout(() => ToastService.profileSaved(), 1000);
    setTimeout(() => ToastService.loginSuccess(), 2000);
    setTimeout(() => ToastService.matchFound(), 3000);
  };

  const showErrorToasts = () => {
    ToastService.error('This is an error message!');
    setTimeout(() => ToastService.validationError('email'), 1000);
    setTimeout(() => ToastService.networkError(), 2000);
    setTimeout(() => ToastService.uploadError(), 3000);
  };

  const showInfoToasts = () => {
    ToastService.info('This is an info message!');
    setTimeout(() => ToastService.profileIncomplete(87), 1000);
    setTimeout(() => ToastService.processing(), 2000);
    setTimeout(() => ToastService.comingSoon(), 3000);
  };

  const showLoadingToasts = () => {
    const loadingId = ToastService.loading('Processing your request...');
    setTimeout(() => {
      ToastService.dismiss(loadingId);
      ToastService.success('Request completed!');
    }, 3000);
  };

  const showImageUploadFlow = () => {
    const uploadId = ToastService.uploading();
    setTimeout(() => {
      ToastService.dismiss(uploadId);
      ToastService.imageUploadSuccess();
    }, 2000);
  };

  const showOTPFlow = () => {
    const otpId = ToastService.sendingOTP();
    setTimeout(() => {
      ToastService.dismiss(otpId);
      const verifyId = ToastService.verifying();
      setTimeout(() => {
        ToastService.dismiss(verifyId);
        ToastService.loginSuccess();
      }, 2000);
    }, 2000);
  };

  const showBrandMessages = () => {
    ToastService.brandMessage('Welcome to Shaadi Mantrana!', 'success');
    setTimeout(() => ToastService.brandMessage('Finding your perfect match...', 'info'), 1000);
    setTimeout(() => ToastService.brandMessage('Connection lost', 'error'), 2000);
  };

  const showNotificationToasts = () => {
    ToastService.newMessage();
    setTimeout(() => ToastService.newLike(), 1000);
    setTimeout(() => ToastService.newView(), 2000);
  };

  const showAdminToasts = () => {
    ToastService.adminActionSuccess('User approval');
    setTimeout(() => ToastService.adminActionError('delete user'), 1000);
  };

  const showPremiumToasts = () => {
    ToastService.premiumFeature();
    setTimeout(() => ToastService.upgradeSuccess(), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎨 Toast Demo
          </h1>
          <p className="text-lg text-gray-600">
            Beautiful, animated toasts with Shaadi Mantrana branding
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Success Toasts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Success Toasts
            </h3>
            <button
              onClick={showSuccessToasts}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Show Success Toasts
            </button>
          </div>

          {/* Error Toasts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-red-500 mr-2">❌</span>
              Error Toasts
            </h3>
            <button
              onClick={showErrorToasts}
              className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Show Error Toasts
            </button>
          </div>

          {/* Info Toasts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-blue-500 mr-2">ℹ️</span>
              Info Toasts
            </h3>
            <button
              onClick={showInfoToasts}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Show Info Toasts
            </button>
          </div>

          {/* Loading Toasts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-blue-500 mr-2">⏳</span>
              Loading Toasts
            </h3>
            <button
              onClick={showLoadingToasts}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Show Loading Toast
            </button>
          </div>

          {/* Image Upload Flow */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-purple-500 mr-2">📸</span>
              Image Upload Flow
            </h3>
            <button
              onClick={showImageUploadFlow}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Simulate Upload
            </button>
          </div>

          {/* OTP Flow */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-orange-500 mr-2">📱</span>
              OTP Flow
            </h3>
            <button
              onClick={showOTPFlow}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Simulate OTP
            </button>
          </div>

          {/* Brand Messages */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-pink-500 mr-2">💕</span>
              Brand Messages
            </h3>
            <button
              onClick={showBrandMessages}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Show Brand Messages
            </button>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-indigo-500 mr-2">🔔</span>
              Notifications
            </h3>
            <button
              onClick={showNotificationToasts}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Show Notifications
            </button>
          </div>

          {/* Admin Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-gray-500 mr-2">👨‍💼</span>
              Admin Actions
            </h3>
            <button
              onClick={showAdminToasts}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-700 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Show Admin Toasts
            </button>
          </div>

          {/* Premium Features */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="text-yellow-500 mr-2">⭐</span>
              Premium Features
            </h3>
            <button
              onClick={showPremiumToasts}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Show Premium Toasts
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🎨 Toast Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">✨ Visual Features</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Beautiful gradient backgrounds</li>
                  <li>• Smooth slide-in animations</li>
                  <li>• Progress bars with brand colors</li>
                  <li>• Hover effects and micro-interactions</li>
                  <li>• Mobile-responsive design</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">🎯 Brand Integration</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Shaadi Mantrana color scheme</li>
                  <li>• Consistent typography (Inter font)</li>
                  <li>• Brand-specific emojis and messages</li>
                  <li>• Accessibility support</li>
                  <li>• Reduced motion support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 