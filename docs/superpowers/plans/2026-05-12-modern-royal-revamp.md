# Modern Royal UI Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Shaadi Mantrana UI into a luxury heritage experience using the "Modern Royal" design system.

**Architecture:** We will implement a theme-driven layer using global CSS variables and GSAP for high-end motion. Components will be "skinned" rather than rebuilt to preserve existing logic.

**Tech Stack:** Next.js (App Router), Tailwind CSS, GSAP, Framer Motion.

---

### Task 1: Foundation - Global Design Tokens
**Files:**
- Modify: `frontend/src/app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Define CSS Variables for the Royal Palette**
```css
:root {
  --royal-obsidian: #121212;
  --royal-gold: #D4AF37;
  --royal-gold-light: #F9E29C;
  --royal-crimson: #800000;
  --royal-glass: rgba(255, 255, 255, 0.05);
}
```
- [ ] **Step 2: Update Tailwind Config with Custom Colors and Fonts**
- [ ] **Step 3: Verify the base colors apply by changing the background of the root layout**
- [ ] **Step 4: Commit**
```bash
git add frontend/src/app/globals.css tailwind.config.ts
git commit -m "feat: initialize Modern Royal design tokens"
```

### Task 2: Component - The Royal Login Card
**Files:**
- Modify: `frontend/src/components/LoginForm.tsx`
- Create: `frontend/src/components/ui/MandalaBackground.tsx`

- [ ] **Step 1: Create the MandalaBackground component with GSAP rotation**
- [ ] **Step 2: Wrap LoginForm in the new Royal Card (Glassmorphism + Gold Border)**
- [ ] **Step 3: Replace standard buttons with the 'Brushed Gold' button variant**
- [ ] **Step 4: Verify Phone Auth flow still works in the new UI**
- [ ] **Step 5: Commit**
```bash
git add frontend/src/components/LoginForm.tsx frontend/src/components/ui/MandalaBackground.tsx
git commit -m "feat: implement Refined Royal Login UI"
```

### Task 3: Component - The Majestic Swipe Card
**Files:**
- Modify: `frontend/src/app/dashboard/SwipeCard.tsx`
- Create: `frontend/src/components/ui/GoldLeafFrame.tsx`

- [ ] **Step 1: Create the GoldLeafFrame component (SVG-based thin gold frame)**
- [ ] **Step 2: Wrap the profile photo in the GoldLeafFrame**
- [ ] **Step 3: Refactor action buttons (Connect, Shortlist) into the integrated sleek bar**
- [ ] **Step 4: Verify swiping logic still functions correctly**
- [ ] **Step 5: Commit**
```bash
git add frontend/src/app/dashboard/SwipeCard.tsx frontend/src/components/ui/GoldLeafFrame.tsx
git commit -m "feat: implement Royal SwipeCard with Gold Leaf framing"
```

### Task 4: Motion - GSAP Parallax & Tilt
**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`
- Modify: `frontend/src/app/dashboard/SwipeCard.tsx`

- [ ] **Step 1: Implement the Mandala Parallax in the Dashboard background**
- [ ] **Step 2: Add the GSAP Tilt effect to the SwipeCard on hover/touch**
- [ ] **Step 3: Coordinate Swipe direction with Mandala rotation (Opposite shift)**
- [ ] **Step 4: Verify performance (no jank during swipe)**
- [ ] **Step 5: Commit**
```bash
git add frontend/src/app/dashboard/page.tsx frontend/src/app/dashboard/SwipeCard.tsx
git commit -m "feat: implement GSAP Parallax and Tilt motion engine"
```
