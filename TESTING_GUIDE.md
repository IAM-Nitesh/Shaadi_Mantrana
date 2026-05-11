# UI & Animation Testing Guide

## 🎯 Quick Start

To test that all UI and animations are working correctly after the migration:

1. Start the development server:
```bash
cd frontend
npm run dev
```

2. Open your browser to `http://localhost:3000`

## ✅ Test Checklist

### 1. Login Page Animations
**URL:** `http://localhost:3000/login` or `http://localhost:3000/`

- [ ] Logo entrance animation plays on page load
- [ ] Login card fades in smoothly
- [ ] Floating hearts animate in background
- [ ] Features list staggers in
- [ ] Form transitions work smoothly

### 2. Bottom Navigation
Test on all pages:

#### Dashboard (`/dashboard`)
- [ ] Bottom navigation appears at bottom of page
- [ ] All 4 icons visible: Home, Matches, Profile, Settings
- [ ] Active page (Dashboard/Home) is highlighted
- [ ] Icons have subtle hover/press animations
- [ ] Tapping icons navigates to correct pages
- [ ] Content doesn't get hidden under bottom nav

#### Matches (`/matches`)
- [ ] Bottom navigation appears
- [ ] "Matches" icon is highlighted as active
- [ ] Match cards animate in
- [ ] Filter modal animations work
- [ ] Match celebration toast works (if you get a match)

#### Profile (`/profile`)
- [ ] Bottom navigation appears
- [ ] "Profile" icon is highlighted
- [ ] Profile sections stagger in with GSAP animation
- [ ] Onboarding overlay animates if first time
- [ ] Field validation animations work
- [ ] Save button animations work
- [ ] Interest modal animations work

#### Settings (`/settings`)
- [ ] Bottom navigation appears
- [ ] "Settings" icon is highlighted
- [ ] Logout confirmation modal animates
- [ ] Logout animation plays when confirming

### 3. Page Transitions
Navigate between pages and verify:
- [ ] Smooth fade transitions between pages
- [ ] No jarring jumps or flashes
- [ ] Loading states show correctly
- [ ] Transitions complete in ~80ms (should feel instant)

### 4. Toast Notifications
Trigger toasts by:
- [ ] Saving profile - Success toast should appear
- [ ] Form validation errors - Error toast should appear
- [ ] System messages - Info toast should appear

Check:
- [ ] Toast slides in from top
- [ ] Toast can be dismissed by swiping
- [ ] Toast auto-dismisses after timeout
- [ ] Multiple toasts stack correctly

### 5. PWA Features
- [ ] Install prompt appears (if applicable)
- [ ] Update prompt appears when new version available
- [ ] Offline mode works
- [ ] App can be installed to home screen

### 6. Modal Animations
Test modals throughout the app:
- [ ] Interest modal (Profile page) - Add interest button
- [ ] Filter modal (Matches page) - Filter button
- [ ] Logout confirmation (Settings page) - Logout button

Check:
- [ ] Backdrop fades in
- [ ] Modal scales/slides in
- [ ] Close animations work
- [ ] Background is properly blurred

### 7. Mobile-Specific Features

Test on mobile device or use Chrome DevTools mobile emulation:

#### Safe Area Insets
- [ ] Content not hidden under status bar
- [ ] Content not hidden under bottom nav
- [ ] Content not hidden under home indicator (iOS)

#### Touch Targets
- [ ] All buttons are easily tappable (48px minimum)
- [ ] Bottom nav items respond to touch
- [ ] No accidental taps

#### Gestures (if implemented)
- [ ] Pull-to-refresh works (if enabled)
- [ ] Swipe gestures work
- [ ] Haptic feedback works (if enabled)

### 8. Performance
- [ ] Pages load quickly (< 2 seconds)
- [ ] Animations are smooth (60fps)
- [ ] No janky scrolling
- [ ] Images load progressively
- [ ] No layout shifts

## 🐛 Common Issues to Check

### Issue: Bottom Navigation Not Showing
- Check browser console for errors
- Verify you're logged in
- Check that the page is not an admin page

### Issue: Animations Not Playing
- Check browser console for GSAP errors
- Verify JavaScript is enabled
- Check for conflicting styles

### Issue: Page Transitions Broken
- Check browser console for React errors
- Verify PageTransitionProvider is in layout
- Check for routing issues

### Issue: Toast Not Appearing
- Check browser console for errors
- Verify ToasterClient is rendered
- Check z-index conflicts

## 📱 Browser Testing Matrix

Test in these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Safari iOS (mobile)
- [ ] Chrome Android (mobile)

## 🎨 Visual Regression Testing

Take screenshots of:
1. Login page
2. Dashboard
3. Profile page (with onboarding overlay)
4. Matches page (with and without matches)
5. Settings page
6. Each modal

Compare with previous version or designs.

## 🚀 Final Verification

After completing all tests:

1. **No Console Errors** - Check browser console for any errors
2. **Smooth UX** - Everything should feel fast and responsive
3. **Visual Polish** - All animations should look professional
4. **Mobile Ready** - Works perfectly on mobile devices
5. **Accessible** - All features work with keyboard and screen readers

## 📊 Test Results Template

Use this to document your testing:

```
## Test Results - [Date]

### Login Page Animations
- Logo animation: ✅ / ❌
- Card fade-in: ✅ / ❌
- Hearts animation: ✅ / ❌
- Form transitions: ✅ / ❌

### Bottom Navigation
- Dashboard: ✅ / ❌
- Matches: ✅ / ❌
- Profile: ✅ / ❌
- Settings: ✅ / ❌

### Page Transitions
- Between pages: ✅ / ❌
- Loading states: ✅ / ❌

### Toast Notifications
- Success toast: ✅ / ❌
- Error toast: ✅ / ❌
- Swipe to dismiss: ✅ / ❌

### Modals
- Interest modal: ✅ / ❌
- Filter modal: ✅ / ❌
- Logout modal: ✅ / ❌

### Mobile Features
- Safe area insets: ✅ / ❌
- Touch targets: ✅ / ❌

### Performance
- Page load speed: ✅ / ❌
- Animation smoothness: ✅ / ❌

### Browser Compatibility
- Chrome: ✅ / ❌
- Firefox: ✅ / ❌
- Safari: ✅ / ❌
- Mobile Safari: ✅ / ❌
- Mobile Chrome: ✅ / ❌

### Overall Assessment
- Ready for production: ✅ / ❌
- Issues found: [List any issues]
- Recommended actions: [List recommendations]
```

## 🔧 Debugging Tips

### Enable Debug Logging
Check browser console for debug messages from:
- `logger.debug()` - General debug messages
- GSAP errors - Animation issues
- React warnings - Component issues

### Network Tab
Check for:
- Failed API requests
- Slow loading assets
- Missing files

### Performance Tab
Record page load and check for:
- Long tasks
- Layout shifts
- Paint events

## 📞 Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Review `UI_ANIMATION_STATUS.md` for component status
3. Review `UI_MIGRATION_SUMMARY.md` for changes made
4. Check React DevTools for component tree issues

