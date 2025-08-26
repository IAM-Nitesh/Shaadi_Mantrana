'use client';

import { gsap } from 'gsap';

// Safe GSAP wrapper to prevent console errors
export const safeGsap = {
  // Helper: robust querySelectorAll wrapper that falls back for selectors that
  // may be invalid for the browser's CSS selector parser (for example,
  // Tailwind classnames containing '/'). Returns an array-like NodeList or
  // plain array.
  _safeQuerySelectorAll: (selector: string) => {
    try {
      return document.querySelectorAll(selector);
    } catch (err) {
      // Fallback: handle simple class selectors like '.a.b.c' by scanning
      // all elements and matching classList tokens exactly. This avoids
      // passing problematic selectors (with characters like '/') to the
      // CSS parser which can throw SyntaxError in some runtimes.
      try {
        if (typeof selector === 'string' && selector.startsWith('.')) {
          const classTokens = selector.split('.').filter(Boolean);
          const all = Array.from(document.getElementsByTagName('*'));
          const matches = all.filter(el => {
            if (!el.classList) return false;
            return classTokens.every(tok => el.classList.contains(tok));
          });
          return matches;
        }
      } catch (e) {
        // ignore and fall through
      }
      return [];
    }
  },

  to: (target: gsap.TweenTarget, vars: gsap.TweenVars) => {
    try {
      // If target is a string selector, resolve elements safely and pass
      // the actual nodes to GSAP to avoid GSAP doing its own querySelectorAll
      if (typeof target === 'string') {
        const elements = safeGsap._safeQuerySelectorAll(target);
        if (!elements || elements.length === 0) return null;
        return gsap.to(elements as any, vars);
      }
      return gsap.to(target, vars);
    } catch {
      return null;
    }
  },

  from: (target: gsap.TweenTarget, vars: gsap.TweenVars) => {
    try {
      if (typeof target === 'string') {
        const elements = safeGsap._safeQuerySelectorAll(target);
        if (!elements || elements.length === 0) return null;
        return gsap.from(elements as any, vars);
      }
      return gsap.from(target, vars);
    } catch {
      return null;
    }
  },

  fromTo: (target: gsap.TweenTarget, fromVars: gsap.TweenVars, toVars: gsap.TweenVars) => {
    try {
      if (typeof target === 'string') {
        const elements = safeGsap._safeQuerySelectorAll(target);
        if (!elements || elements.length === 0) return null;
        return gsap.fromTo(elements as any, fromVars, toVars);
      }
      return gsap.fromTo(target, fromVars, toVars);
    } catch {
      return null;
    }
  },

  set: (target: gsap.TweenTarget, vars: gsap.TweenVars) => {
    try {
      if (typeof target === 'string') {
        const elements = safeGsap._safeQuerySelectorAll(target);
        if (!elements || elements.length === 0) return null;
        return gsap.set(elements as any, vars);
      }
      return gsap.set(target, vars);
    } catch {
      return null;
    }
  },

  // Kill tweens safely
  killTweensOf: (target?: gsap.TweenTarget) => {
    try {
      if (typeof target === 'string') {
        const elements = safeGsap._safeQuerySelectorAll(target);
        if (!elements || elements.length === 0) return null;
      }
      // gsap.killTweensOf may or may not be present depending on build, guard it
      // @ts-ignore - gsap types don't always include optional chaining here
      return gsap.killTweensOf?.(target);
    } catch {
      return null;
    }
  },

  timeline: (vars?: gsap.TimelineVars) => {
    try {
      return gsap.timeline(vars);
    } catch {
      return null;
    }
  }
};
