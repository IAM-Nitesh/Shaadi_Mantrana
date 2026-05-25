'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from '../utils/logger';
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
  logger.error('ErrorBoundary caught an error:', error, errorInfo);
    
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
        <div className="min-h-screen bg-royal-obsidian flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-modern rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 bg-royal-crimson/20 border border-royal-crimson rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_15px_rgba(255,51,102,0.3)]"
            >
              <CustomIcon name="ri-error-warning-line" className="text-3xl text-royal-crimson" />
            </motion.div>

            {/* Error Message */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-royal-gold font-playfair mb-4"
            >
              Oops! Something went wrong
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-royal-gold/60 font-inter mb-6"
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
                <div className="bg-gray-100 rounded-lg p-3 text-xs font-mono text-white/80 font-inter overflow-auto">
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
                className="w-full bg-royal-gold text-royal-obsidian py-3 px-6 rounded-xl font-semibold hover:bg-royal-gold-light transition-all duration-200 shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]"
              >
                <CustomIcon name="ri-refresh-line" className="inline mr-2" />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-royal-glass border border-royal-glass-border text-royal-gold py-3 px-6 rounded-xl font-semibold hover:bg-royal-gold/10 transition-all duration-200"
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
    logger.error('Error caught by useErrorHandler:', error);
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
      className={`bg-royal-crimson/10 border border-royal-crimson/30 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-start">
        <CustomIcon name="ri-error-warning-line" className="text-royal-crimson mt-0.5 mr-3 flex-shrink-0" />
        
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-royal-crimson mb-1">
            Error
          </h3>
          <p className="text-sm text-royal-crimson/80 mb-3">
            {error}
          </p>
          
          <div className="flex space-x-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs bg-royal-crimson/20 text-royal-crimson px-3 py-1 rounded-lg hover:bg-royal-crimson/30 transition-colors"
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs text-royal-crimson hover:text-white transition-colors"
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
