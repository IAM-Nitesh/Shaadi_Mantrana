# DESIGN SPEC: Shaadi Mantrana "Modern Royal" Revamp

**Date:** 2026-05-12  
**Status:** Approved (Conceptual)  
**Vision:** Elevate the existing matchmaking experience into a "one-of-a-kind" luxury heritage journey using deep charcoal, brushed gold, and GSAP-powered depth.

---

## 1. CORE AESTHETIC PILLARS
- **Palette**: 
  - `bg-obsidian`: `#121212` (Deep Charcoal)
  - `accent-gold`: `#D4AF37` (Brushed Metallic Gold)
  - `text-royal`: `#F5F5DC` (Cream White for high contrast)
  - `card-glass`: `rgba(255, 255, 255, 0.05)` with `backdrop-blur: 20px`
- **Typography**:
  - **Headings**: `Playfair Display` (Serif) - Medium/Bold
  - **Body/Data**: `Inter` or `Montserrat` (Sans) - Regular/Medium
- **Signature Elements**:
  - **The Gold Leaf**: Thin (1px) gold-etched borders around profile images.
  - **The Mandala**: 2D vector Mandala patterns used at 5% opacity for background depth.

---

## 2. COMPONENT SPECIFICATIONS

### 2.1 The Royal Login (LoginForm.tsx)
- **Background**: `bg-obsidian` with a large centered Mandala rotating at `0.5deg/sec`.
- **The Card**: Glassmorphism container with a `1px` gold border.
- **Fields**: Input fields for Phone Number with gold focus rings (`ring-accent-gold`).
- **Button**: `bg-accent-gold` with a subtle linear gradient and `text-obsidian`. 
- **Motion**: On "Get OTP" click, the card should "unfold" using GSAP `scaleY` and `opacity` transitions.

### 2.2 The Majestic Dashboard (SwipeCard.tsx)
- **The Frame**: Profile photos must be wrapped in a `div` with a gold-leaf SVGs border.
- **Action Bar**: A horizontal row at the bottom of the card containing `Connect`, `Shortlist`, and `View Profile`.
  - **Style**: Text-only or minimal icons in gold, separated by subtle vertical dividers.
- **Motion (GSAP)**:
  - **Swipe Parallax**: As the user drags the card, the background Mandala shifts `-20px` in the opposite direction and rotates `5deg`.
  - **Tilt**: The card itself uses `gsap` to tilt slightly (±5deg) based on cursor/touch position.

### 2.3 The Jewelry Navigation (GlobalBottomNavigation.tsx)
- **Container**: `bg-obsidian` with a top border of `1px solid accent-gold`.
- **Icons**: Sleek 3D-sculpted gold silhouettes.
- **Active State**: Active icon scales by `1.2x` and gains a soft saffron outer glow.

---

## 3. MOTION STRATEGY (GSAP)
- **Transition Duration**: Standard 400ms (as per Premium UI constraints).
- **Easing**: `power4.out` for a "Liquid Metal" feel.
- **Parallax Logic**: 
  - `Mandala_Layer_1`: Speed 0.1 (Slow rotation)
  - `Mandala_Layer_2`: Speed 0.2 (Counter-rotation)
  - `Main_Card`: Speed 1.0 (Direct interaction)

---

## 4. FEATURE ALIGNMENT (NO ASSUMPTIONS)
- **Auth**: ONLY Phone + OTP (Firebase). No social logins.
- **Discovery**: Swipe-based card stack only.
- **Navigation**: Matches current route map in `ModernNavigation.tsx`.

---

**Approval Tracking**:
- [x] Conceptual Vibe (Refined Option A)
- [x] Login Form Fields (Phone/OTP Only)
- [x] Dashboard Layout (Integrated Actions)
- [x] Visual Ramp-up (Gold Leaf + Parallax)
