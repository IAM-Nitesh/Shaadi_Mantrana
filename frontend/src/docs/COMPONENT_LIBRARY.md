# Shaadi Mantrana Component Library

## 📱 Mobile-First Design System for Android App

This document provides comprehensive documentation for the Shaadi Mantrana component library, optimized for Android mobile applications with modern, accessible, and performant components.

---

## 🎨 Design System Overview

### Design Tokens
- **Colors**: 50+ semantic color tokens
- **Typography**: Mobile-optimized font scales
- **Spacing**: 4px base unit system
- **Shadows**: 6-level elevation system
- **Border Radius**: 8-level radius system
- **Transitions**: 8 animation timing functions

### Android Optimizations
- **Touch Targets**: Minimum 48px for accessibility
- **Safe Areas**: iOS/Android safe area support
- **Hardware Acceleration**: GPU-optimized animations
- **Reduced Motion**: Respects user preferences
- **Dark Mode**: Complete dark theme support

---

## 🧩 Core Components

### 1. Icon System

#### `<Icon />` - Base Icon Component
```tsx
import { Icon } from '@/components/IconSystem';

// Basic usage
<Icon name="ri-heart-line" size="md" />

// With custom styling
<Icon 
  name="ri-user-fill" 
  size="lg" 
  color="#ec4899"
  className="text-rose-500"
  aria-label="User profile"
/>
```

**Props:**
- `name`: Icon name from registry
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' or number
- `className`: Additional CSS classes
- `color`: Custom color override
- `aria-label`: Accessibility label
- `aria-hidden`: Hide from screen readers

**Available Icons:**
- **Navigation**: home, heart, user, chat, settings
- **Actions**: camera, close, arrow-left, arrow-right, filter
- **Status**: check-circle, warning, shield-check
- **Communication**: mail, phone, customer-service
- **System**: lock, logout, briefcase, map-pin, calendar

#### `<IconButton />` - Touch-Optimized Button
```tsx
import { IconButton } from '@/components/IconSystem';

<IconButton
  name="ri-heart-line"
  size="lg"
  variant="primary"
  onClick={handleLike}
  aria-label="Like profile"
/>
```

**Variants:**
- `primary`: Rose gradient background
- `secondary`: White with rose border
- `ghost`: Transparent with hover state
- `danger`: Red for destructive actions

#### `<IconText />` - Icon with Label
```tsx
import { IconText } from '@/components/IconSystem';

<IconText
  name="ri-chat-3-line"
  text="Messages"
  direction="vertical"
  size="md"
/>
```

---

### 2. Typography System

#### Text Classes
```css
/* Display Headings */
.text-display-2xl    /* 60px - Hero sections */
.text-display-xl     /* 48px - Large hero */
.text-display-lg     /* 36px - Medium hero */

/* Standard Headings */
.text-heading-xl     /* 30px - Page titles */
.text-heading-lg     /* 24px - Section headers */
.text-heading-md     /* 20px - Subsection headers */
.text-heading-sm     /* 18px - Card titles */
.text-heading-xs     /* 16px - Small headers */

/* Body Text */
.text-body-xl        /* 20px - Large body */
.text-body-lg        /* 18px - Medium body */
.text-body-md        /* 16px - Default body */
.text-body-sm        /* 14px - Small body */
.text-body-xs        /* 12px - Tiny body */

/* Labels */
.text-label-lg       /* 14px - Form labels */
.text-label-md       /* 12px - Button labels */
.text-label-sm       /* 10px - Small labels */

/* Captions */
.text-caption-lg     /* 12px - Image captions */
.text-caption-md     /* 10px - Small captions */
.text-caption-sm     /* 8px - Tiny captions */

/* Special */
.text-brand-lg       /* 30px - Brand text with gradient */
.text-brand-md       /* 24px - Medium brand text */
.text-brand-sm       /* 20px - Small brand text */

/* Semantic Colors */
.text-error          /* Error messages */
.text-success        /* Success messages */
.text-warning        /* Warning messages */
.text-info           /* Info messages */
.text-muted          /* Muted text */
```

#### Responsive Typography
```css
/* Automatically scales on larger screens */
.text-responsive-display-2xl
.text-responsive-heading-xl
.text-responsive-body-lg
```

#### Touch-Friendly Text
```css
.text-touch-lg       /* Large touch-friendly text */
.text-touch-md       /* Medium touch-friendly text */
.text-touch-sm       /* Small touch-friendly text */
```

---

### 3. Button System

#### Primary Button
```tsx
<button className="btn-primary">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="btn-secondary">
  Secondary Action
</button>
```

#### Icon Button
```tsx
<IconButton
  name="ri-heart-line"
  variant="primary"
  size="lg"
  aria-label="Like"
/>
```

#### Button Variants
- `btn-primary`: Rose gradient background
- `btn-secondary`: White with rose border
- `btn-ghost`: Transparent with hover
- `btn-danger`: Red for destructive actions

---

### 4. Card System

#### Basic Card
```tsx
<div className="card-modern">
  <div className="p-6">
    <h3 className="text-heading-md mb-2">Card Title</h3>
    <p className="text-body-md text-muted">Card content</p>
  </div>
</div>
```

#### Interactive Card
```tsx
<div className="card-modern card-interactive">
  <div className="p-6">
    <h3 className="text-heading-md mb-2">Interactive Card</h3>
    <p className="text-body-md text-muted">Hover for effects</p>
  </div>
</div>
```

#### Swipe Card
```tsx
import SwipeCard from '@/app/dashboard/SwipeCard';

<SwipeCard
  profile={profileData}
  onSwipe={handleSwipe}
/>
```

**Features:**
- Drag/swipe functionality
- Haptic feedback
- Image optimization
- Loading states
- Error handling

---

### 5. Navigation System

#### Bottom Navigation
```tsx
import SmoothNavigation from '@/components/SmoothNavigation';

const navItems = [
  { href: '/dashboard', icon: 'ri-heart-line', label: 'Discover' },
  { href: '/matches', icon: 'ri-chat-3-line', label: 'Matches' },
  { href: '/profile', icon: 'ri-user-line', label: 'Profile' },
  { href: '/settings', icon: 'ri-settings-line', label: 'Settings' }
];

<SmoothNavigation items={navItems} />
```

**Features:**
- Access control based on profile completion
- Smooth animations
- Badge support
- Touch-optimized targets

---

### 6. Form Components

#### Input Field
```tsx
<div className="form-group">
  <label className="text-label-lg mb-2">Email Address</label>
  <input
    type="email"
    className="input-modern"
    placeholder="Enter your email"
  />
</div>
```

#### Select Dropdown
```tsx
<select className="input-modern">
  <option>Select an option</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

#### Form Validation
```tsx
<input
  type="email"
  className="input-modern animate-tilt-error"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<div id="email-error" className="text-error mt-1">
  Please enter a valid email address
</div>
```

---

### 7. Loading Components

#### Heartbeat Loader
```tsx
import HeartbeatLoader from '@/components/HeartbeatLoader';

<HeartbeatLoader
  size="xl"
  logoSize="xxl"
  textSize="lg"
  text="Loading profiles..."
  showText={true}
/>
```

#### Skeleton Loader
```tsx
<div className="skeleton-loader">
  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
</div>
```

---

### 8. Animation Components

#### Match Animation
```tsx
import MatchAnimation from '@/components/MatchAnimation';

<MatchAnimation
  isVisible={showMatch}
  onClose={() => setShowMatch(false)}
  matchName="Priya Sharma"
/>
```

**Features:**
- Confetti animation
- Pulsing heart effect
- Floating hearts
- Smooth transitions

#### Page Transitions
```tsx
import { PageTransitionProvider } from '@/components/PageTransitionProvider';

<PageTransitionProvider>
  {children}
</PageTransitionProvider>
```

---

### 9. Toast Notifications

#### Success Toast
```tsx
import { toast } from 'sonner';

toast.success('Profile updated successfully!');
```

#### Error Toast
```tsx
toast.error('Failed to update profile');
```

#### Loading Toast
```tsx
toast.loading('Updating profile...');
```

#### Custom Toast
```tsx
toast.custom((t) => (
  <div className="bg-white p-4 rounded-lg shadow-lg">
    <p className="text-heading-sm">Custom Message</p>
  </div>
));
```

---

## 🎯 Usage Guidelines

### 1. Mobile-First Approach
- Always design for mobile first
- Use touch-friendly target sizes (minimum 48px)
- Optimize for one-handed use
- Consider thumb reach zones

### 2. Accessibility
- Provide proper ARIA labels
- Ensure sufficient color contrast
- Support keyboard navigation
- Test with screen readers

### 3. Performance
- Use hardware-accelerated animations
- Optimize images with lazy loading
- Minimize bundle size
- Respect reduced motion preferences

### 4. Android Optimization
- Use Material Design principles
- Implement proper safe areas
- Add haptic feedback where appropriate
- Optimize for Android navigation patterns

---

## 🎨 Styling Guidelines

### Color Usage
```css
/* Primary Actions */
background: var(--color-primary-500);
color: var(--color-neutral-0);

/* Secondary Actions */
background: var(--color-neutral-0);
color: var(--color-primary-600);
border: 1px solid var(--color-primary-200);

/* Success States */
color: var(--color-success-600);

/* Error States */
color: var(--color-error-600);

/* Muted Content */
color: var(--color-neutral-500);
```

### Spacing System
```css
/* Use consistent spacing tokens */
padding: var(--space-4);        /* 16px */
margin: var(--space-6);         /* 24px */
gap: var(--space-3);            /* 12px */
border-radius: var(--radius-lg); /* 8px */
```

### Typography Scale
```css
/* Use semantic typography classes */
.text-heading-lg               /* For section headers */
.text-body-md                  /* For body content */
.text-caption-sm               /* For small details */
.text-brand-md                 /* For brand elements */
```

---

## 🔧 Development Workflow

### 1. Adding New Components
1. Create component in appropriate directory
2. Follow naming conventions
3. Add TypeScript interfaces
4. Include accessibility attributes
5. Add to documentation
6. Test on mobile devices

### 2. Icon Management
1. Add new icons to `ICON_REGISTRY`
2. Include proper categorization
3. Add aliases for search
4. Update documentation
5. Test across different sizes

### 3. Design Token Updates
1. Update `design-tokens.css`
2. Test across all components
3. Update documentation
4. Verify dark mode support
5. Check accessibility compliance

---

## 📱 Android-Specific Features

### Touch Targets
```css
.touch-target-min {
  min-height: 48px;
  min-width: 48px;
}
```

### Safe Areas
```css
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}
```

### Hardware Acceleration
```css
.gpu-accelerated {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### Android Scroll
```css
.android-scroll {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
```

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Test on various screen sizes
- [ ] Verify dark mode appearance
- [ ] Check animation performance
- [ ] Validate touch interactions

### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast ratios
- [ ] Focus indicators

### Performance Testing
- [ ] Animation frame rates
- [ ] Bundle size impact
- [ ] Memory usage
- [ ] Battery consumption

---

## 📚 Resources

### Design System
- [Design Tokens](./design-tokens.css)
- [Typography System](./typography.css)
- [Component Styles](../styles/globals.css)

### External Resources
- [Material Design Guidelines](https://material.io/design)
- [Android Accessibility Guidelines](https://developer.android.com/guide/topics/ui/accessibility)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🤝 Contributing

1. Follow the established patterns
2. Maintain consistency with existing components
3. Add comprehensive documentation
4. Test thoroughly on mobile devices
5. Ensure accessibility compliance

---

*Last updated: December 2024*
*Version: 1.0.0*

