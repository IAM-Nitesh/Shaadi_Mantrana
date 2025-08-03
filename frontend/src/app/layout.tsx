import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// import NavigationGuard from '../components/NavigationGuard';
import { Toaster } from 'react-hot-toast';
import PageTransitionProvider from '../components/PageTransitionProvider';
import PageLoadingIndicator from '../components/PageLoadingIndicator';
import LenisProvider from './LenisProvider';
import PageDataLoadingProvider from '../components/PageDataLoadingProvider';
import PerformanceOptimizer from '../components/PerformanceOptimizer';
import { PWAProvider } from '../components/PWAProvider';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shaadi Mantrana',
  description: 'Find your perfect match with Shaadi Mantrana',
  manifest: '/manifest.json',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shaadi Mantra',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://shaadimantra.com',
    title: 'Shaadi Mantra',
    description: 'Find your perfect match with Shaadi Mantra',
    siteName: 'Shaadi Mantra',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shaadi Mantra',
    description: 'Find your perfect match with Shaadi Mantra',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover' as const,
  themeColor: '#667eea',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PerformanceOptimizer>
          <LenisProvider>
            <PageDataLoadingProvider>
              <PWAProvider>
                <PageTransitionProvider>
                  <PageLoadingIndicator />
                  {/* <NavigationGuard> */}
                    {children}
                  {/* </NavigationGuard> */}
                </PageTransitionProvider>
              </PWAProvider>
            </PageDataLoadingProvider>
          </LenisProvider>
        </PerformanceOptimizer>
        
        {/* Party.js for confetti animations */}
        <script
          src="https://cdn.jsdelivr.net/npm/party-js@latest/bundle/party.min.js"
          async
        />
        
        <Toaster 
          position="top-center" 
          reverseOrder={false}
          toastOptions={{
                        // Default options for all types
                        duration: 3000,
                        style: {
                          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                          color: '#1f2937',
                          borderRadius: '16px',
                          padding: '16px 20px',
                          fontSize: '14px',
                          fontWeight: '500',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          boxShadow: '0 10px 25px rgba(236, 72, 153, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(236, 72, 153, 0.1)',
                          backdropFilter: 'blur(10px)',
                          maxWidth: '400px',
                          minWidth: '300px',
                          cursor: 'pointer',
                          userSelect: 'none',
                        },
                        success: {
                          duration: 4000,
                          style: {
                            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                            color: '#065f46',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                          },
                          iconTheme: {
                            primary: '#10b981',
                            secondary: '#ffffff',
                          },
                        },
                        error: {
                          duration: 5000,
                          style: {
                            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                            color: '#991b1b',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                          },
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#ffffff',
                          },
                        },
                        loading: {
                          style: {
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            color: '#0c4a6e',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)',
                          },
                          iconTheme: {
                            primary: '#3b82f6',
                            secondary: '#ffffff',
                          },
                        },
                        // Custom animation for all toasts
                        className: 'toast-animation',
                      }}
                      // Custom container styling
                      containerStyle={{
                        top: 20,
                        zIndex: 9999,
                      }}
                      // Custom gutter for spacing between toasts
                      gutter={12}
                      // Enable swipe to dismiss
                      swipeDirection="x"
                      swipeThreshold={50}
                      />
      </body>
    </html>
  );
}
