'use client';

import { gsap } from 'gsap';

// Safe GSAP wrapper to prevent console errors
export const safeGsap = {
  to: (target: gsap.TweenTarget, vars: gsap.TweenVars) => {
    try {
      // Check if target exists for string selectors
      if (typeof target === 'string') {
        const elements = document.querySelectorAll(target);
        if (elements.length === 0) return null;
      }
      return gsap.to(target, vars);
    } catch (error) {
      return null;
    }
  },

  from: (target: gsap.TweenTarget, vars: gsap.TweenVars) => {
    try {
      if (typeof target === 'string') {
        const elements = document.querySelectorAll(target);
        if (elements.length === 0) return null;
      }
      return gsap.from(target, vars);
    } catch (error) {
      return null;
    }
  },

  fromTo: (target: gsap.TweenTarget, fromVars: gsap.TweenVars, toVars: gsap.TweenVars) => {
    try {
      if (typeof target === 'string') {
        const elements = document.querySelectorAll(target);
        if (elements.length === 0) return null;
      }
      return gsap.fromTo(target, fromVars, toVars);
    } catch (error) {
      return null;
    }
  },

  set: (target: gsap.TweenTarget, vars: gsap.TweenVars) => {
    try {
      if (typeof target === 'string') {
        const elements = document.querySelectorAll(target);
        if (elements.length === 0) return null;
      }
      return gsap.set(target, vars);
    } catch (error) {
      return null;
    }
  },

  timeline: (vars?: gsap.TimelineVars) => {
    try {
      return gsap.timeline(vars);
    } catch (error) {
      return null;
    }
  }
};
