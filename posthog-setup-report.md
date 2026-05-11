<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Shaadi Mantrana Next.js App Router project. Here is a summary of all changes made:

**Setup & initialization**
- `frontend/instrumentation-client.ts` — initializes PostHog using the Next.js 15.3+ recommended approach (runs client-side before the React tree). Includes privacy settings: all inputs masked, phone/OTP/password fields force-masked, `localStorage` persistence, and exception capture enabled.
- `frontend/src/components/PostHogProvider.tsx` — provides the `PHProvider` React context wrapper so `usePostHog()` hooks work throughout the component tree.
- `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` set in `frontend/.env.local`.

**User identification**
- `posthog.identify(userId, { role })` called in `frontend/src/contexts/AuthContext.tsx` on every successful auth check.
- `posthog.reset()` called on logout to clear the PostHog identity.

**Error tracking**
- `posthog.captureException()` in `LoginForm.tsx` (login errors), `dashboard/page.tsx` (swipe failures), and `ChatComponent.tsx` (message send errors).

**Event tracking**

| Event | Description | File |
|---|---|---|
| `otp_requested` | User successfully requests a phone OTP | `frontend/src/components/LoginForm.tsx` |
| `user_logged_in` | User completes OTP verification and logs in | `frontend/src/components/LoginForm.tsx` |
| `login_failed` | OTP verification fails | `frontend/src/components/LoginForm.tsx` |
| `profile_swiped` | User swipes a discovery profile (like, pass, or super_like) | `frontend/src/app/dashboard/page.tsx` |
| `match_chat_started` | User taps a mutual match card to open chat | `frontend/src/app/matches/page.tsx` |
| `filter_applied` | User applies discovery filters (age, profession, country, state) | `frontend/src/app/matches/page.tsx` |
| `message_sent` | User successfully sends a message in chat | `frontend/src/app/chat/ChatComponent.tsx` |
| `user_unmatched` | User confirms and completes an unmatch in chat | `frontend/src/app/chat/ChatComponent.tsx` |
| `user_logged_out` | User confirms logout from the Settings page | `frontend/src/app/settings/page.tsx` |
| `profile_photo_uploaded` | User successfully uploads a profile photo to B2 storage | `frontend/src/app/profile/page.tsx` |
| `profile_saved` | User saves their profile (includes completeness %, photo_uploaded flag) | `frontend/src/app/profile/page.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://eu.posthog.com/project/177090/dashboard/674537)
- [Login Funnel (OTP → Verified)](https://eu.posthog.com/project/177090/insights/2qGAMd0e) — OTP-to-login conversion rate, 1-hour window
- [Profile Completion Funnel](https://eu.posthog.com/project/177090/insights/PQORe2cC) — Login-to-profile-saved conversion, 7-day window
- [Swipe Activity by Action](https://eu.posthog.com/project/177090/insights/v5LsoOyV) — Daily like/pass/super_like volume breakdown
- [Match → First Message Conversion](https://eu.posthog.com/project/177090/insights/2sWIFMXn) — Chat-open to first-message-sent conversion
- [Churn Signals (Logouts & Unmatches)](https://eu.posthog.com/project/177090/insights/ahCoC2BL) — Daily logouts and unmatches as disengagement indicators

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
