import { Inter, Great_Vibes, Cormorant_Infant } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { getServerSession } from '../lib/auth-server';
import PageTransitionProvider from '../components/PageTransitionProvider';
import { PWAProvider } from '../components/PWAProvider';
import PageDataLoadingProvider from '../components/PageDataLoadingProvider';
import ToasterClient from '../components/ToasterClient';
import DevTools from '../components/DevTools';
import GlobalBottomNavigation from '../components/GlobalBottomNavigation';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const headingFont = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-heading',
});

const bodyFont = Cormorant_Infant({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'Shaadi Mantrana',
  description: 'Find your perfect match with Shaadi Mantrana',
  manifest: '/manifest.json',
  themeColor: '#ec4899',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shaadi Mantrana',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = null;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${headingFont.variable} ${bodyFont.variable} font-body`}>
        <AuthProvider initialUser={initialUser}>
          <PWAProvider>
            <PageTransitionProvider>
              <PageDataLoadingProvider>
                {children}
                <ToasterClient />
                <DevTools />
                <GlobalBottomNavigation />
              </PageDataLoadingProvider>
            </PageTransitionProvider>
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}