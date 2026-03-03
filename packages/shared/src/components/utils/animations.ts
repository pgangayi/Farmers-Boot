/**
 * ANIMATION UTILITIES
 * ===================
 * Animation helpers and presets for consistent motion design
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

export const presets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  popIn: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
  bounce: {
    initial: { y: 0 },
    animate: { y: [-4, 0, -4, 0] },
    transition: { duration: 2, ease: 'easeInOut', repeat: Infinity },
  },
  pulse: {
    animate: { opacity: [1, 0.5, 1] },
    transition: { duration: 2, ease: 'easeInOut', repeat: Infinity },
  },
  shake: {
    animate: { x: [0, -4, 4, -4, 4, 0] },
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
  spin: {
    animate: { rotate: 360 },
    transition: { duration: 1, ease: 'linear', repeat: Infinity },
  },
} as const;

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

export function useStaggerAnimation(itemCount: number, baseDelay: number = 100): number[] {
  return Array.from({ length: itemCount }, (_, i) => i * baseDelay);
}

export function getStaggerDelay(
  index: number,
  baseDelay: number = 100,
  maxDelay: number = 1000
): number {
  return Math.min(index * baseDelay, maxDelay);
}

// ============================================================================
// ANIMATED NUMBER HOOK
// ============================================================================

export function useAnimatedNumber(
  target: number,
  duration: number = 1000,
  startOnMount: boolean = true
): { value: number; start: () => void; reset: () => void } {
  const [value, setValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const animate = useCallback(
    (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(easeProgress * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setValue(target);
      }
    },
    [target, duration]
  );

  const start = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    startTimeRef.current = null;
    rafRef.current = requestAnimationFrame(animate);
  }, [animate, isAnimating]);

  const reset = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setIsAnimating(false);
    setValue(0);
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    if (startOnMount) {
      start();
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [startOnMount, start]);

  return { value, start, reset };
}

// ============================================================================
// SPRING ANIMATION
// ============================================================================

interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export function useSpring(
  target: number,
  config: SpringConfig = {}
): { value: number; isAnimating: boolean } {
  const { stiffness = 100, damping = 10, mass = 1 } = config;
  const [value, setValue] = useState(target);
  const [isAnimating, setIsAnimating] = useState(false);
  const currentRef = useRef(target);
  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setIsAnimating(true);

    const animate = () => {
      const displacement = target - currentRef.current;
      const springForce = displacement * stiffness;
      const dampingForce = velocityRef.current * damping;
      const acceleration = (springForce - dampingForce) / mass;

      velocityRef.current += acceleration * 0.016; // Approx 60fps
      currentRef.current += velocityRef.current * 0.016;

      setValue(currentRef.current);

      if (Math.abs(displacement) < 0.01 && Math.abs(velocityRef.current) < 0.01) {
        setValue(target);
        setIsAnimating(false);
        currentRef.current = target;
        velocityRef.current = 0;
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, stiffness, damping, mass]);

  return { value, isAnimating };
}

// ============================================================================
// ANIMATION CSS CLASS GENERATORS
// ============================================================================

export function getAnimationClasses(animation: keyof typeof presets, delay?: number): string {
  const classes = ['animate-in'];

  switch (animation) {
    case 'fadeIn':
      classes.push('fade-in');
      break;
    case 'fadeInUp':
      classes.push('fade-in-up');
      break;
    case 'fadeInDown':
      classes.push('fade-in-down');
      break;
    case 'scaleIn':
      classes.push('scale-in');
      break;
    case 'slideInLeft':
      classes.push('slide-in-left');
      break;
    case 'slideInRight':
      classes.push('slide-in-right');
      break;
    case 'popIn':
      classes.push('pop-in');
      break;
  }

  if (delay) {
    classes.push(`delay-${delay}`);
  }

  return classes.join(' ');
}

// ============================================================================
// RIPPLE EFFECT
// ============================================================================

export function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  }, []);

  return { ripples, createRipple };
}
