# 💍 Shaadi Mantrana: Enterprise Product Blueprint
**Version**: 1.0 (2026-05-12)  
**Role**: Product Strategist / Solution Architect  
**Status**: Implementation-Ready  

---

## 1. Executive Summary & Strategic Vision

### Market Positioning
Shaadi Mantrana is a **High-Intent Premium Matrimonial Platform** designed for the modern urban professional. It bridges the gap between the casual nature of dating apps and the clinical, often outdated feel of traditional matrimonial sites.

### Competitive Differentiation
*   **The "Modern Royal" Aesthetic**: A premium, luxury UI (Obsidian, Gold, Crimson) that elevates the user's journey from a "search" to an "experience."
*   **Trust-First Verification**: Mandatory OTP and AI-driven behavior monitoring to ensure a bot-free, high-integrity community.
*   **Behavioral Matchmaking**: Moving beyond static filters to understand user intent through interaction patterns.

### Core Platform Philosophy
*   **Marriage over Matches**: Optimizing for long-term compatibility, not just swipe volume.
*   **Privacy by Design**: User-controlled visibility and screenshot-resistant architecture.

### Success Metrics (North Star)
*   **Match Acceptance Rate (MAR)**: % of suggested matches that result in a mutual interest.
*   **Meaningful Conversation Rate**: % of users who exchange >10 messages within 48 hours of matching.

---

## 2. Product Principles & Experience Philosophy

| Principle | Description |
| :--- | :--- |
| **Trust-First Matchmaking** | Safety is not a feature; it is the foundation. Every interaction must reinforce the user's sense of security. |
| **Privacy-by-Design** | Users own their data. Defaults favor privacy (e.g., blurring photos for non-premium or unverified users). |
| **Low-Friction Onboarding** | OTP-first login followed by a progressive profiling system that doesn't overwhelm the user. |
| **Intent-Driven Engagement** | The system rewards active, serious seekers and deprioritizes passive or "window-shopping" accounts. |
| **Safety over Virality** | We would rather have 1,000 verified, high-quality users than 100,000 unverified ones. |

---

## 3. Persona Architecture

### Bride/Groom Persona Segments
1.  **The Serious Seeker**: High-intent, ready to marry within 6-12 months. Values depth over quantity.
2.  **The Family-Assisted User**: Managed by parents or siblings. Requires "Shared Access" or "Reviewer" permissions.
3.  **The Premium Professional**: High-income, time-poor. Needs AI to do the heavy lifting of filtering and shortlisting.
4.  **The Passive Browser**: New to the platform, testing the waters. Needs "Nudge" triggers to complete profiling.

### Admin Personas
1.  **Support Moderator**: Handles standard profile edits and basic user queries.
2.  **Fraud Investigator**: Specialized in detecting "Sugar-Dating" scams, financial fraud, and fake identities.
3.  **Super Admin**: System-wide configuration, revenue monitoring, and high-level data access.

---

## 4. Master User Journeys

### Macro Journey: Acquisition to Marriage Success
1.  **Entry**: Social/OTP Auth → Identity Verification.
2.  **Discovery**: AI-curated "Daily Picks" → Search & Filters.
3.  **Engagement**: Interest Request → Acceptance → Premium Paywall (if applicable) → Chat.
4.  **Success**: Milestone Tracking → Account Deactivation (Success Story).

### Micro Journeys (Edge Cases & Recoveries)
*   **OTP Failure**: Fallback to WhatsApp Auth or Voice Call OTP after 3 failed attempts.
*   **Interest Rejection**: AI analyzes the rejection reason to refine the user's preference model.
*   **Ghosting Recovery**: If a user is inactive for 72 hours mid-conversation, a "Gentle Nudge" notification is sent.

---

## 5. Core Module Deep-Dives

### A. Recommendation Intelligence Layer
The engine combines **Explicit Preferences** (Community, Age, Income) with **Implicit Behavior** (Profiles clicked, time spent on bio, messaging speed).

*   **Behavioral Scoring**: Users earn "Intent Points" for completed bios, verified IDs, and responsive messaging.
*   **Compatibility Confidence**: A % score shown on profiles explaining *why* they match (e.g., "Both value work-life balance").
*   **Cold-Start Logic**: New users are initially matched based on wide-net demographics, then rapidly refined via a "Discovery Phase" (Swiping on 10 curated profiles).

### B. Notification & Engagement Engine
*   **Push Strategy**: High-priority for Matches/Interests; Low-priority for "Tips."
*   **Match Urgency**: "Someone you liked just became active" — triggers real-time engagement.
*   **Smart Reminders**: Periodic "Profile Strength" updates to encourage data completion.

---

## 6. Trust, Safety & Moderation (Automation-First)

### Risk Scoring Framework
| Risk Level | Trigger | Action |
| :--- | :--- | :--- |
| **Low** | Standard profile update. | Auto-approve, post-facto AI scan. |
| **Medium** | Rapid swiping, copy-paste messages. | Shadow-ban (throttle visibility) + Manual Review. |
| **High** | Blacklisted keywords, IP mismatch. | Immediate Account Lock + Fraud Desk Escalation. |

*   **AI Vision**: Automatic blurring of offensive content or non-portrait images.
*   **Device Fingerprinting**: Prevent banned users from creating new accounts on the same hardware.

---

## 7. Admin Command Center

*   **Moderation Queue**: Kanban-style board for flagged content.
*   **SLA Matrix**: Critical reports (Harassment) must be addressed within 2 hours.
*   **Audit Logs**: Every admin action (View, Ban, Edit) is timestamped and logged for internal accountability.

---

## 8. Business Logic & Technical Architecture

### A. Core Database Entities (MongoDB)
*   **User**: `id, phone, role, verification_status, behavior_score, preferences_id`
*   **Profile**: `id, user_id, bio, photos[], career_details, lifestyle_details`
*   **Interest**: `id, sender_id, receiver_id, status (pending/accepted/rejected), timestamp`
*   **Subscription**: `id, user_id, tier, start_date, end_date, auto_renew_flag`

### B. State Transitions
*   **Profile States**: `Draft` → `Pending_Review` → `Active` → `Hidden` → `Banned`.
*   **Interest States**: `Sent` → `Delivered` → `Seen` → `Accepted/Declined`.

### C. Event-Driven Architecture
*   `ON_MATCH_SUCCESS` → Trigger Push Notification + Create Socket Room.
*   `ON_PAYMENT_SUCCESS` → Unlock Chat permissions + Send Welcome Email.

---

## 9. Monetization & Growth Systems (Freemium)

### Freemium Restrictions
*   **Free**: Browse profiles, send limited interest requests (3/day), view blurred photos.
*   **Premium**: Unlimited Interests, Unblurred Photos, Direct Chat, Profile Boost (2x visibility).

### Conversion Funnels
*   **Paywall Trigger**: When a user clicks "Message" or tries to view the 4th profile of the day.
*   **Pricing Psychology**: Use "Gold" and "Platinum" tiers to anchor value; offer "One-month trial" for new users.

---

## 10. KPI Tracking & Operational Excellence

### Product KPIs
*   **DAU/MAU Ratio**: Stickiness of the platform.
*   **Average Time to First Match**: Efficiency of the recommendation engine.

### Moderation KPIs
*   **False Positive Rate**: % of legitimate users wrongly flagged by AI.
*   **Review Throughput**: Number of profiles reviewed per moderator/hour.

---

## 11. Compliance, Privacy & Legal Framework

*   **Consent Architecture**: Granular toggles for "Who can see my phone number" and "Who can see my photo."
*   **India DPDP Compliance**: Clear data processing notices, right to erasure (account deletion), and data fiduciary accountability.
*   **Screenshot Prevention**: Disable screenshots in the app (native) or add heavy watermarks in the web view.

---

## 12. Future Scalability & Roadmap

*   **Phase 2**: Voice/Video Verification (Live liveness check).
*   **Phase 3**: Family Accounts (Collaborative matchmaking).
*   **Phase 4**: Matchmaker Marketplace (Human experts assisting the AI).
*   **Phase 5**: Global Expansion (Localization for NRI markets).

---
*End of Blueprint*
