import type { Transition, Variants } from 'framer-motion';

/**
 * Motion Physics Tokens
 * ---------------------
 * Strictly separated into Productive (crisp, fast micro-interactions)
 * and Expressive (calibrated springs for spatial hierarchy).
 * Only GPU-accelerated `transform` and `opacity` are animated; never linear easing.
 */

export const PRODUCTIVE_EASE = [0.2, 0, 0, 1] as const;

export const productiveTransition: Transition = {
  duration: 0.2,
  ease: PRODUCTIVE_EASE,
};

export const productiveFastTransition: Transition = {
  duration: 0.18,
  ease: PRODUCTIVE_EASE,
};

export const productiveExitTransition: Transition = {
  duration: 0.18,
  ease: PRODUCTIVE_EASE,
};

export const snappySpring: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 30,
};

export const spatialSpring: Transition = {
  type: 'spring',
  stiffness: 160,
  damping: 24,
};

export const tapFeedback = {
  scale: 0.97,
} as const;

export const STAGGER_INTERVAL_SEC = 0.055; // Capped below 60ms

export const heroStaggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: STAGGER_INTERVAL_SEC,
    },
  },
};

export const heroStaggerItem: Variants = {
  hidden: {
    opacity: 1,
    transform: 'translateY(8px)',
  },
  visible: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: spatialSpring,
  },
};

export const surfaceRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    transform: 'scale(0.97) translateY(8px)',
  },
  visible: {
    opacity: 1,
    transform: 'scale(1) translateY(0px)',
    transition: spatialSpring,
  },
};

export const modalSurfaceVariants: Variants = {
  hidden: {
    opacity: 0,
    transform: 'scale(0.96) translateY(6px)',
  },
  visible: {
    opacity: 1,
    transform: 'scale(1) translateY(0px)',
    transition: snappySpring,
  },
  exit: {
    opacity: 0,
    transform: 'scale(0.97) translateY(4px)',
    transition: productiveExitTransition,
  },
};

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: productiveFastTransition,
  },
  exit: {
    opacity: 0,
    transition: productiveExitTransition,
  },
};

export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    transform: 'translateY(12px) scale(0.96)',
  },
  visible: {
    opacity: 1,
    transform: 'translateY(0px) scale(1)',
    transition: snappySpring,
  },
  exit: {
    opacity: 0,
    transform: 'translateY(8px) scale(0.97)',
    transition: productiveExitTransition,
  },
};
