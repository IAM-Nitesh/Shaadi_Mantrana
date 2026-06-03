import React from 'react';
// import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import ToasterClient from '../components/ToasterClient';
import GlobalBottomNavigation from '../components/GlobalBottomNavigation';
import { PostHogProvider } from '../components/PostHogProvider';

import PageTransitionProvider from '../components/PageTransitionProvider';
import CapacitorInit from '../components/CapacitorInit';

// Fallback to system font stack to bypass build-time Google Fonts fetch
const inter = { className: 'font-sans' };
// const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Shaadi Mantrana',
  description: 'Find your perfect match with Shaadi Mantrana',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shaadi Mantrana',
  },
};

export const viewport = {
  themeColor: '#121212',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = null;

  return (
    <html lang="en" className="bg-royal-obsidian">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" rel="stylesheet" />
      </head>
      <body className={`${inter.className} font-body antialiased bg-royal-obsidian text-royal-gold-light/90`}>
        <PostHogProvider>
          <CapacitorInit />
          <AuthProvider initialUser={initialUser}>
            <PageTransitionProvider globalUI={
              <>
                <ToasterClient />
                <GlobalBottomNavigation />
              </>
            }>
              <main>{children}</main>
            </PageTransitionProvider>
          </AuthProvider>
        </PostHogProvider>

        {/* Global Failsafe: Force clear any stuck loaders after 10s */}
        <script dangerouslySetInnerHTML={{ __html: `
          setTimeout(() => {
            const loaders = document.querySelectorAll('[class*="loader"], [class*="Loader"]');
            if (loaders.length > 0) {
              loaders.forEach(l => {
                l.style.opacity = '0';
                l.style.pointerEvents = 'none';
                setTimeout(() => l.style.display = 'none', 500);
              });
              document.body.style.overflow = 'auto';
            }
          }, 10000);
        `}} />
      </body>
    </html>
  );
}