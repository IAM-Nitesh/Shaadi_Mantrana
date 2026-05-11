'use client';

import React from 'react';
import toast, { Toast, ToastOptions } from 'react-hot-toast';

/**
 * Helper function to create swipeable toast notifications
 * This wraps react-hot-toast to provide consistent styling and behavior
 */
export const SwipeableToast = {
  /**
   * Show a success toast notification
   * @param message The message to display
   * @param options Additional toast options
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: 5000,
      ...options
    });
  },

  /**
   * Show an error toast notification
   * @param message The message to display
   * @param options Additional toast options
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: 5000,
      ...options
    });
  },

  /**
   * Show an info toast notification
   * @param message The message to display
   * @param options Additional toast options
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(message, {
      duration: 3000,
      ...options
    });
  },

  /**
   * Show a loading toast notification
   * @param message The message to display
   * @param options Additional toast options
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...options
    });
  },

  /**
   * Dismiss a specific toast by its ID
   * @param id The toast ID to dismiss
   */
  dismiss: (id: string) => {
    toast.dismiss(id);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Custom toast with icon and message
   * @param message The message to display
   * @param icon The icon component to display
   * @param options Additional toast options
   */
  custom: (
    message: string | React.ReactNode,
    icon?: React.ReactNode,
    options?: ToastOptions
  ) => {
    return toast.custom(
      (t) => (
        <div
          className={`toast-animation swipeable-toast ${t.visible ? 'animate-enter' : 'animate-leave'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
            color: '#1f2937',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 10px 25px rgba(236, 72, 153, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(236, 72, 153, 0.1)',
            minWidth: '300px',
          }}
        >
          {icon && <div className="mr-3">{icon}</div>}
          <div>{message}</div>
        </div>
      ),
      {
        duration: 3000,
        ...options,
      }
    );
  }
};

export default SwipeableToast;