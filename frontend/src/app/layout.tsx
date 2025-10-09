import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { getServerSession } from '../lib/auth-server';
import PageTransitionProvider from '../components/PageTransitionProvider';
import { PWAProvider } from '../components/PWAProvider';
import PageDataLoadingProvider from '../components/PageDataLoadingProvider';
import ToasterClient from '../components/ToasterClient';
import DevTools from '../components/DevTools';
// import GlobalBottomNavigation from '../components/GlobalBottomNavigation';

const inter = Inter({ subsets: ['latin'] });

// Force dynamic rendering since we use cookies for auth
export const dynamic = 'force-dynamic';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getServerSession();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <AuthProvider initialUser={initialUser}>
          <PWAProvider>
            <PageTransitionProvider>
              <PageDataLoadingProvider>
                {children}
                <ToasterClient />
                <DevTools />
                {/* <GlobalBottomNavigation /> */}
              </PageDataLoadingProvider>
            </PageTransitionProvider>
          </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}