'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import CustomIcon from './CustomIcon';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CustomIcon name="ri-error-warning-line" className="text-3xl text-red-500" />
            </motion.div>

            {/* Error Message */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-800 mb-4"
            >
              Oops! Something went wrong
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mb-6"
            >
              We encountered an unexpected error. Don't worry, your data is safe.
            </motion.p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.details
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6 text-left"
              >
                <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-gray-100 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-auto">
                  <div className="mb-2">
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.details>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <button
                onClick={this.handleRetry}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <CustomIcon name="ri-refresh-line" className="inline mr-2" />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                <CustomIcon name="ri-home-line" className="inline mr-2" />
                Go to Home
              </button>
            </motion.div>

            {/* Contact Support */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-xs text-gray-500 mt-6"
            >
              If this problem persists, please contact our support team.
            </motion.p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Error caught by useErrorHandler:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
}

// Error Alert Component
export function ErrorAlert({
  error,
  onRetry,
  onDismiss,
  className = '',
}: {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-start">
        <CustomIcon name="ri-error-warning-line" className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800 mb-1">
            Error
          </h3>
          <p className="text-sm text-red-700 mb-3">
            {error}
          </p>
          
          <div className="flex space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
