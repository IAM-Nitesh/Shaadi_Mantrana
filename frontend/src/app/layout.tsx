import React from 'react';
// import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import ToasterClient from '../components/ToasterClient';
import GlobalBottomNavigation from '../components/GlobalBottomNavigation';
import { PostHogProvider } from '../components/PostHogProvider';

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = null;

  return (
    <html lang="en" className="bg-royal-obsidian">
      <body className={`${inter.className} font-body antialiased bg-royal-obsidian text-royal-gold-light/90`}>
        <PostHogProvider>
          <AuthProvider initialUser={initialUser}>
            <main>{children}</main>
            <ToasterClient />
            <GlobalBottomNavigation />
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