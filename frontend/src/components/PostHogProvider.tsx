'use client';

/**
 * PostHogProvider — Session Recording & Analytics
 *
 * Mounted as a Client Component so it doesn't break the RSC root layout.
 * Privacy rules for a matrimony app:
 *   - All text inputs masked by default (maskAllInputs: true)
 *   - Phone and password fields force-masked even if maskAllInputs is toggled off
 *   - No PII sent in event properties — use anonymous user IDs only
 *
 * Free tier: 1M events/month. At 2000 users that covers well into growth.
 */

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    // Guard: don't init without a key (local dev without .env.local is fine)
    if (!key) {
      if (process.env.NODE_ENV === 'development') {
        console.info('[PostHog] NEXT_PUBLIC_POSTHOG_KEY not set — analytics disabled');
      }
      return;
    }

    posthog.init(key, {
      api_host: host,
      // App Router: disable automatic pageview capture — use usePostHogPageview per route
      capture_pageview: false,
      // Capture JS exceptions automatically (closes the JS-layer crash gap)
      capture_exceptions: true,
      session_recording: {
        maskAllInputs: true,
        maskInputFn: (text: string, element?: HTMLElement) => {
          const el = element as HTMLInputElement | undefined;
          const type = el?.type?.toLowerCase();
          const name = el?.name?.toLowerCase() ?? '';
          const autocomplete = el?.getAttribute('autocomplete')?.toLowerCase() ?? '';

          // Always mask sensitive fields regardless of maskAllInputs setting
          if (
            type === 'password' ||
            type === 'tel' ||
            name.includes('phone') ||
            name.includes('mobile') ||
            name.includes('otp') ||
            name.includes('aadhaar') ||
            autocomplete.includes('tel') ||
            autocomplete.includes('password')
          ) {
            return '***';
          }
          return text;
        },
      },
      // Disable cookie — use localStorage instead (simpler GDPR posture)
      persistence: 'localStorage',
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
