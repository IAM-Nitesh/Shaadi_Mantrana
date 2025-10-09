'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/LoginForm';
import { safeGsap } from '../../components/SafeGsap';
import HeartbeatLoader from '../../components/HeartbeatLoader';

export default function LoginPage() {
  const { isAuthenticated, isLoading, user, redirectTo } = useAuth();
  const router = useRouter();
  
  const [isRouterReady, setIsRouterReady] = useState(false);

  // GSAP refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const heartsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  // Initialize router
  useEffect(() => {
    setIsRouterReady(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isRouterReady && isAuthenticated && redirectTo) {
      const target = redirectTo ?? '/';
      console.log('🔍 LoginPage: User already authenticated, redirecting to', target);
      router.push(target);
    }
  }, [isRouterReady, isAuthenticated, redirectTo, router]);

  // GSAP animations
  useEffect(() => {
    if (!isRouterReady) return;

    try {
      // Set initial states
      safeGsap.set?.([logoRef.current, cardRef.current, heartsRef.current, featuresRef.current], {
        opacity: 0,
        y: 50
      });

      // Create timeline
      const tl = safeGsap.timeline?.();
      if (!tl) return;

      // Animate elements in sequence
      tl.to?.(logoRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out"
      })
      .to?.(cardRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.4")
      .to?.(heartsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3")
      .to?.(featuresRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.3");

      // Floating hearts animation
      if (heartsRef.current) {
        safeGsap.to?.(heartsRef.current, {
          y: -20,
          duration: 3,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1
        });
      }

    } catch (error) {
      console.error('❌ LoginPage: Animation error:', error);
    }
  }, [isRouterReady]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center">
        <HeartbeatLoader 
          logoSize="xxl"
          textSize="lg"
          text="Loading..."
          showText={true}
        />
      </div>
    );
  }

  // Show login form
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Background */}
      <div ref={backgroundRef} className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Branding */}
            <div className="text-center lg:text-left">
              <div ref={logoRef} className="mb-8">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">
                  Shaadi<span className="text-rose-500">Mantrana</span>
                </h1>
                <p className="text-xl text-gray-600">
                  Your journey to forever starts here
                </p>
              </div>

              <div ref={featuresRef} className="space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💝</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Smart Matching</h3>
                    <p className="text-gray-600">Quality Matches</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Quality Profiles</h3>
                    <p className="text-gray-600">Verified Users</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Easy to Use</h3>
                    <p className="text-gray-600">Simple Interface</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Login Form */}
            <div className="flex justify-center">
              <LoginForm />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-sm">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-rose-500 hover:text-rose-600">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-rose-500 hover:text-rose-600">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
