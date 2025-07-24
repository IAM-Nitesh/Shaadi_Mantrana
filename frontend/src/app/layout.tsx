'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import ConsoleSuppressor from "../components/ConsoleSuppressor";
import { usePathname } from 'next/navigation';
import LenisProvider from "./LenisProvider";
import { AnimatePresence, motion } from 'framer-motion';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#e11d48" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Shaadi Mantra" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="192x192" href="/icon.svg" />
        <link rel="icon" type="image/svg+xml" sizes="512x512" href="/icon-512.svg" />
        <link rel="mask-icon" href="/icon.svg" color="#e11d48" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}
      >
        <ConsoleSuppressor />
        <ErrorBoundary />
        <LenisProvider>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </LenisProvider>
    </body>
  </html>
);
}
