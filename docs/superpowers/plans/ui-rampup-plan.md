# 🎨 UI RAMPUP PLAN: MOBILE-FIRST ROYAL RETROFIT

> **Goal**: Complete the "Modern Royal" aesthetic transition with a strict mobile-first approach, ensuring 100% theme consistency and native-app feel (Capacitor/Android).

## Phase 1: Global Shell & Infrastructure (High Confidence)
1. **Viewport Calibration**:
   - Update `frontend/src/app/layout.tsx` `viewport.themeColor` to `#121212` (Royal Obsidian).
   - Add `bg-royal-obsidian` to the `body` tag in `layout.tsx` to prevent white flashes.
2. **Typography Alignment**:
   - Verify `Playfair Display` (Heading) and `Inter` (Body) are correctly loaded and applied as per `globals.css`.

## Phase 2: Navigation & Interaction (Medium Confidence)
1. **Royal Bottom Nav**:
   - Retrofit `frontend/src/components/SmoothNavigation.tsx`:
     - Replace `text-rose-500` with `text-royal-gold`.
     - Replace `bg-white/95` with `bg-royal-obsidian/95` or `bg-royal-glass`.
     - Add `backdrop-blur-xl`.
2. **Haptic Integration**:
   - Add `@capacitor/haptics` triggers to `SmoothNavigation` buttons.
   - Verify compatibility with non-Capacitor (web) environments.

## Phase 3: Dashboard Majestic Revamp (Medium Confidence)
1. **Swipe Action Buttons**:
   - Update `frontend/src/app/dashboard/page.tsx`:
     - Pass (Left): `bg-white` -> `bg-royal-glass` with `text-royal-gold`.
     - Like (Right): `rose-500` -> `bg-gradient-to-r from-royal-gold to-royal-gold-light`.
     - Super Like (Up): `blue-500` -> `bg-gradient-to-r from-royal-crimson to-royal-gold`.
2. **Swipe Card Polish**:
   - Ensure `SwipeCard` content follows the Royal typography and contrast rules.

## Phase 4: Final Verification (High Confidence)
1. **Preflight T1/T2**:
   - Run `./scripts/preflight.sh` to ensure no build regressions.
2. **Mobile Audit**:
   - Verify all interactive elements meet the `--touch-target-ideal (56px)` requirement.
   - Check contrast ratios for `royal-gold` on `royal-obsidian` (target > 4.5:1).

---
**Acceptance Criteria**:
- [ ] No `rose-500` or `#ec4899` remaining in core app flows.
- [ ] Bottom navigation reflects the Royal theme.
- [ ] Mobile safe areas are respected in all new layouts.
- [ ] Capacitor sync passes with new assets.
