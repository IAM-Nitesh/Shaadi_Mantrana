# 👑 Design Spec: Royal Loading System

**Date**: 2026-05-16
**Status**: Pending Review
**Domain**: UI/UX / Frontend

## 1. Vision
To replace generic brand-logo loaders with a tiered system of "Sacred" loading states that reflect the premium, Indian-luxury identity of Shaadi Mantrana. The system must feel ritualistic, elegant, and high-performance.

## 2. Tier 1: The Sacred Mandala (Grand)

### Visual Architecture
- **Asset**: A multi-layered SVG Mandala.
- **Layers**:
  - `Base`: Outer geometric ring (Static/Slow).
  - `Middle`: Floral/Petal layer (Counter-clockwise rotation).
  - `Inner`: The core knot (Clockwise rotation + Glow).
- **Colors**: 
  - Stroke: `Royal Gold (#D4AF37)`
  - Glow: `rgba(212, 175, 55, 0.3)` via `drop-shadow`.

### Animation Logic (GSAP)
- **Rotation**: Independent speeds for layers to create a "weaving" parallax effect.
- **Pulse**: A subtle `scale: 1.05` and `opacity` pulse every 3 seconds, timed to a "breath" rhythm.
- **Easing**: `power2.inOut` for all transitions.

## 3. Tier 2: Royal Skeletons (Element Level)

### Visual Architecture
- **Background**: `Royal Obsidian (#121212)`
- **Shimmer Gradient**: 
  ```css
  linear-gradient(
    90deg, 
    rgba(18, 18, 18, 0) 0%, 
    rgba(212, 175, 55, 0.05) 50%, 
    rgba(18, 18, 18, 0) 100%
  )
  ```
- **Finesse**: Border-radius of `1.5rem` to match the "Royal Card" aesthetic.

### Animation Logic
- **Sweep**: A 2.5-second linear sweep from left to right, repeating infinitely.
- **Interconnect**: Skeletons in a list (e.g., Match Feed) will have staggered shimmer starts for a more organic feel.

## 4. Tier 3: Mandala Spark (Micro)

### Visual Architecture
- **Design**: A simplified 8-point version of the Grand Mandala.
- **Size**: Optimized for 16px - 24px.
- **Usage**: Inside buttons (`Login`, `Connect`) and small status indicators.

## 5. Component API (`RoyalLoader.tsx`)

```typescript
interface RoyalLoaderProps {
  variant: 'grand' | 'skeleton' | 'spark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;       // For 'grand' variant
  className?: string;  // For layout overrides
}
```

## 6. Verification Plan

### Manual Check
- [ ] Verify SVG crispness on mobile retina displays.
- [ ] Audit GSAP performance on low-end Android devices (ensure 60fps).
- [ ] Confirm "Obsidian Gold" contrast meets accessibility standards while maintaining the dark-mode aesthetic.

### Automated Check
- [ ] Component renders without hydration mismatch in Next.js 15.
- [ ] Prop validation for all variants.
