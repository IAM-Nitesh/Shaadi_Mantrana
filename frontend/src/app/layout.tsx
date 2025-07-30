import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavigationGuard from '../components/NavigationGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shaadi Mantra',
  description: 'Find your perfect match with Shaadi Mantra',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Temporarily disabled NavigationGuard to get app working */}
        {/* <NavigationGuard> */}
          {children}
        {/* </NavigationGuard> */}
      </body>
    </html>
  );
}
