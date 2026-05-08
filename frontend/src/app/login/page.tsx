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
  const headlineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const securityBadgeRefs = useRef<(HTMLDivElement | null)[]>([]);
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

    // Add small delay to ensure DOM is fully ready
    const timer = setTimeout(() => {
      try {
        // Check if main refs are available
        if (!logoRef.current || !cardRef.current) {
          console.warn('⚠️ GSAP: Main elements not ready yet');
          return;
        }

        console.log('🎨 GSAP Animation Started');

        // Set initial states for logo (with scale)
        safeGsap.set?.(logoRef.current, {
          opacity: 0,
          y: 50,
          scale: 0.8
        });

        // Set initial states for headline words
        headlineRefs.current.forEach((ref) => {
          if (ref) {
            safeGsap.set?.(ref, { opacity: 0, y: 20 });
          }
        });

        // Set initial states for card
        safeGsap.set?.(cardRef.current, {
          opacity: 0,
          y: 50,
          scale: 0.95
        });

        // Set initial states for security badges
        securityBadgeRefs.current.forEach((ref, i) => {
          if (ref) {
            safeGsap.set?.(ref, {
              opacity: 0,
              x: i === 0 ? -50 : 50,
              rotation: i === 0 ? -5 : 5
            });
          }
        });

        // Set initial states for feature cards
        featureCardRefs.current.forEach((ref) => {
          if (ref) {
            safeGsap.set?.(ref, { opacity: 0, y: 30, scale: 0.9 });
          }
        });

        // Create timeline
        const tl = safeGsap.timeline?.();
        if (!tl) {
          console.warn('⚠️ GSAP timeline not available');
          return;
        }

        // 1. Animate logo with elastic bounce
        tl.to?.(logoRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "elastic.out(1, 0.5)"
        }, 0);

        // 2. Staggered headline text reveal
        headlineRefs.current.forEach((ref, i) => {
          if (ref) {
            tl.to?.(ref, {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: "power2.out"
            }, 0.3 + (i * 0.08)); // Stagger delay
          }
        });

        // 3. Login form with bounce
        tl.to?.(cardRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.4)"
        }, "-=0.6");

        // 4. Security badges slide in from sides
        securityBadgeRefs.current.forEach((ref, i) => {
          if (ref) {
            tl.to?.(ref, {
              opacity: 1,
              x: 0,
              rotation: 0,
              duration: 0.6,
              ease: "back.out(1.7)"
            }, i === 0 ? "-=0.4" : "-=0.5");
          }
        });

        // 5. Feature cards staggered animation
        featureCardRefs.current.forEach((card, i) => {
          if (card) {
            tl.to?.(card, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.5,
              ease: "back.out(1.2)"
            }, "-=0.4");
          }
        });

        // 6. Background blob animations (continuous)
        const blobs = document.querySelectorAll('.animate-blob');
        
        if (blobs[0]) {
          safeGsap.to?.(blobs[0], {
            x: 100,
            y: -100,
            duration: 20,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
          });
        }

        if (blobs[1]) {
          safeGsap.to?.(blobs[1], {
            x: -100,
            y: 100,
            duration: 25,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
          });
        }

        if (blobs[2]) {
          safeGsap.to?.(blobs[2], {
            x: 50,
            y: -50,
            duration: 22,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
          });
        }

        // 7. Icon pulse animations (continuous subtle effect)
        const icons = document.querySelectorAll('.feature-icon');
        icons.forEach((icon, i) => {
          safeGsap.to?.(icon, {
            scale: 1.1,
            duration: 2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: i * 0.3
          });
        });

      } catch (error) {
        console.error('❌ LoginPage: Animation error:', error);
      }
    }, 100); // 100ms delay to ensure DOM is ready

    return () => clearTimeout(timer);
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
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Logo section - centered */}
          <div ref={logoRef} className="text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Shaadi<span className="text-rose-500">Mantrana</span>
            </h1>
            <p className="text-lg text-gray-600">
              {["Your", "journey", "to", "forever", "starts", "here"].map((word, i) => (
                <span 
                  key={i} 
                  className="inline-block mr-1" 
                  ref={el => { headlineRefs.current[i] = el; }}
                >
                  {word}
                </span>
              ))}
            </p>
          </div>

          {/* Login Form */}
          <div ref={cardRef} className="flex justify-center">
            <LoginForm />
          </div>

          {/* Security Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              ref={el => { securityBadgeRefs.current[0] = el; }}
              className="flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm"
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">100% Free</p>
                <p className="text-sm text-gray-600">No charges</p>
              </div>
            </div>
            
            <div 
              ref={el => { securityBadgeRefs.current[1] = el; }}
              className="flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-sm"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">🔒</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Secure</p>
                <p className="text-sm text-gray-600">Data safe</p>
              </div>
            </div>
          </div>

          {/* Why Choose Us */}
          <div ref={featuresRef} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm">
            <h2 className="text-center font-bold text-xl text-gray-800 mb-6">Why Choose Us</h2>
            <div className="grid grid-cols-3 gap-4">
              <div 
                ref={el => { featureCardRefs.current[0] = el; }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3 feature-icon">
                  <span className="text-2xl">💝</span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">Smart Matching</h3>
                <p className="text-gray-600 text-xs">Quality Matches</p>
              </div>

              <div 
                ref={el => { featureCardRefs.current[1] = el; }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 feature-icon">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">Quality Profiles</h3>
                <p className="text-gray-600 text-xs">Verified Users</p>
              </div>

              <div 
                ref={el => { featureCardRefs.current[2] = el; }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 feature-icon">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1">Easy to Use</h3>
                <p className="text-gray-600 text-xs">Simple Interface</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
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
