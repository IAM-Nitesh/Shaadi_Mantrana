# Royal Loading System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the logo-based loader with a tiered Sacred Mandala and Royal Skeleton system to enhance UI finesse.

**Architecture:** Use a single `RoyalLoader` component with a `variant` prop. The 'grand' variant uses a multi-layered SVG Mandala animated via GSAP. The 'skeleton' variant uses CSS-driven shimmering gradients.

**Tech Stack:** React (Next.js 15), GSAP (GreenSock), Tailwind CSS, SVG.

---

### Task 1: Global CSS Hardening
**Files:**
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Add Royal Skeleton and Shimmer Keyframes**
Add the following utility classes to `globals.css`:
```css
@keyframes royal-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.royal-skeleton {
  position: relative;
  overflow: hidden;
  background-color: #1a1a1a; /* Lighter than obsidian for visibility */
  border-radius: 1rem;
}

.royal-skeleton::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    rgba(212, 175, 55, 0) 0%,
    rgba(212, 175, 55, 0.08) 50%,
    rgba(212, 175, 55, 0) 100%
  );
  animation: royal-shimmer 2.5s infinite var(--transition-elegant);
}
```

- [ ] **Step 2: Verify CSS Syntax**
Run: `npx lightningcss --check frontend/src/app/globals.css` (or manual check)
- [ ] **Step 3: Commit**
`git add frontend/src/app/globals.css && git commit -m "style: add royal skeleton shimmer animations"`

---

### Task 2: Implement Sacred Mandala SVG & Component
**Files:**
- Modify: `frontend/src/components/RoyalLoader.tsx`

- [ ] **Step 1: Update interface and imports**
```typescript
import { safeGsap } from './SafeGsap';

interface RoyalLoaderProps {
  variant?: 'grand' | 'skeleton' | 'spark' | 'logo'; // Keep logo for compatibility during transition
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showText?: boolean;
  fullScreen?: boolean;
  opacity?: number;
}
```

- [ ] **Step 2: Implement Sacred Mandala SVG Component**
Define an internal `MandalaSVG` component with 3 distinct layers (`layer-outer`, `layer-middle`, `layer-inner`) using complex paths to match the design.

- [ ] **Step 3: Implement GSAP Animation Logic**
Use `useEffect` to target the 3 layers:
- Outer: Slow rotation (`duration: 20, repeat: -1, ease: "none"`)
- Middle: Counter-clockwise (`duration: 15, repeat: -1, ease: "none"`)
- Inner: Pulsing scale (`duration: 3, yoyo: true, repeat: -1`)

- [ ] **Step 4: Update JSX to handle variants**
If `variant === 'skeleton'`, return a div with `.royal-skeleton` and the provided size classes.
If `variant === 'grand'`, return the animated `MandalaSVG`.

- [ ] **Step 5: Verify build**
Run: `npm run build:frontend` (selective)
- [ ] **Step 6: Commit**
`git add frontend/src/components/RoyalLoader.tsx && git commit -m "feat: implement Sacred Mandala and Skeleton variants in RoyalLoader"`

---

### Task 3: Global Integration & Fallback
**Files:**
- Modify: `frontend/src/components/AuthGuardV2.tsx`
- Modify: `frontend/src/components/AdminRouteGuard.tsx`

- [ ] **Step 1: Set AuthGuard to 'grand' variant**
```tsx
<RoyalLoader variant="grand" fullScreen text="Entering the Royal Court..." />
```
- [ ] **Step 2: Set AdminRouteGuard to 'grand' variant**
```tsx
<RoyalLoader variant="grand" fullScreen text="Verifying Admin Credentials..." />
```
- [ ] **Step 3: Commit**
`git add frontend/src/components/AuthGuardV2.tsx frontend/src/components/AdminRouteGuard.tsx && git commit -m "refactor: apply grand mandala loader to auth guards"`

---

### Task 4: Verification & Performance Audit
- [ ] **Step 1: Test on various screen sizes**
- [ ] **Step 2: Ensure GSAP timelines are cleaned up on unmount**
- [ ] **Step 3: Final Commit**
`git commit --allow-empty -m "chore: final verification of Royal Loading System"`
