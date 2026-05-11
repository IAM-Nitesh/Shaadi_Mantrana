'use client';

/**
 * PostHogProvider — React context wrapper for posthog-js/react hooks.
 *
 * PostHog is initialized in instrumentation-client.ts (Next.js 15.3+ approach).
 * This component only provides the React context so that usePostHog() and
 * related hooks work inside the component tree.
 *
 * Privacy rules for a matrimony app:
 *   - All text inputs masked by default (maskAllInputs: true)
 *   - Phone and password fields force-masked even if maskAllInputs is toggled off
 *   - No PII sent in event properties — use anonymous user IDs only
 *
 * Free tier: 1M events/month. At 2000 users that covers well into growth.
 */

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
