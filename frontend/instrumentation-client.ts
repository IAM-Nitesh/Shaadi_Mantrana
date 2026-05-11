import posthog from 'posthog-js';

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
  capture_pageview: false,
  capture_exceptions: true,
  debug: process.env.NODE_ENV === 'development',
  session_recording: {
    maskAllInputs: true,
    maskInputFn: (text: string, element?: HTMLElement) => {
      const el = element as HTMLInputElement | undefined;
      const type = el?.type?.toLowerCase();
      const name = el?.name?.toLowerCase() ?? '';
      const autocomplete = el?.getAttribute('autocomplete')?.toLowerCase() ?? '';

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
  persistence: 'localStorage',
});
