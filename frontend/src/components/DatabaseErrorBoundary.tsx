'use client';
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Wifi, Database } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
  errorType: 'network' | 'database' | 'auth' | 'unknown';
}

class DatabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Analyze error to determine type
    let errorType: 'network' | 'database' | 'auth' | 'unknown' = 'unknown';
    
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      errorType = 'network';
    } else if (error.message.includes('Database') || error.message.includes('MongoDB')) {
      errorType = 'database';
    } else if (error.message.includes('Authentication') || error.message.includes('auth')) {
      errorType = 'auth';
    }
    
    return {
      hasError: true,
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DatabaseErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || null
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown'
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { errorType, error } = this.state;
      
      // Get appropriate icon and colors
      const getErrorConfig = () => {
        switch (errorType) {
          case 'network':
            return {
              icon: Wifi,
              color: 'text-royal-gold',
              bgColor: 'bg-royal-gold/10',
              borderColor: 'border-royal-gold/30',
              title: 'Network Connection Issue',
              description: 'Unable to connect to the server. Please check your internet connection.'
            };
          case 'database':
            return {
              icon: Database,
              color: 'text-royal-gold',
              bgColor: 'bg-royal-gold/10',
              borderColor: 'border-royal-gold/30',
              title: 'Database Connection Issue',
              description: 'The database is temporarily unavailable. Our team is working to resolve this.'
            };
          case 'auth':
            return {
              icon: AlertTriangle,
              color: 'text-royal-gold',
              bgColor: 'bg-royal-gold/10',
              borderColor: 'border-royal-gold/30',
              title: 'Authentication Issue',
              description: 'There was a problem with authentication. Please try logging in again.'
            };
          default:
            return {
              icon: AlertTriangle,
              color: 'text-royal-crimson',
              bgColor: 'bg-royal-crimson/10',
              borderColor: 'border-royal-crimson/30',
              title: 'Unexpected Error',
              description: 'Something went wrong. Please try again or contact support if the issue persists.'
            };
        }
      };
      
      const config = getErrorConfig();
      const Icon = config.icon;
      
      return (
        <div className="min-h-screen bg-royal-obsidian flex items-center justify-center p-4">
          <div className={`max-w-md w-full ${config.bgColor} border ${config.borderColor} rounded-2xl p-8 shadow-2xl backdrop-blur-sm`}>
            <div className="text-center">
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 ${config.bgColor} border ${config.borderColor} rounded-full mb-6`}>
                <Icon className={`w-8 h-8 ${config.color}`} />
              </div>
              
              {/* Title */}
              <h2 className="text-xl font-semibold text-royal-gold font-playfair mb-3">
                {config.title}
              </h2>
              
              {/* Description */}
              <p className="text-royal-gold/80 font-inter mb-6 leading-relaxed">
                {config.description}
              </p>
              
              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && error && (
                <div className="mb-6 p-3 bg-black/40 border border-royal-glass-border rounded-lg text-left">
                  <p className="text-xs font-mono text-royal-gold-light break-all">
                    {error.message}
                  </p>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-royal-gold text-royal-obsidian px-6 py-3 rounded-xl font-medium hover:bg-royal-gold-light transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="w-full bg-royal-glass border border-royal-glass-border text-royal-gold px-6 py-3 rounded-xl font-medium hover:bg-royal-gold/10 transition-colors duration-200"
                >
                  Reload Page
                </button>
              </div>
              
              {/* Status indicator */}
              <div className="mt-6 pt-6 border-t border-royal-glass-border">
                <p className="text-xs text-royal-gold/60">
                  Status: <span className="font-medium text-royal-gold">{errorType.charAt(0).toUpperCase() + errorType.slice(1)} Error</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DatabaseErrorBoundary;
