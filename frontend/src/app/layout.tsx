import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import PageTransitionProvider from '../components/PageTransitionProvider';
import { PWAProvider } from '../components/PWAProvider';
import PageDataLoadingProvider from '../components/PageDataLoadingProvider';
import ToasterClient from '../components/ToasterClient';
import DevTools from '../components/DevTools';
import GlobalBottomNavigation from '../components/GlobalBottomNavigation';
import { PostHogProvider } from '../components/PostHogProvider';

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
  themeColor: '#ec4899',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = null;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="font-body antialiased">
        <PostHogProvider>
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
        </PostHogProvider>
      </body>
    </html>
  );
}