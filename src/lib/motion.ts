import type { Transition, Variants } from "framer-motion";

/**
 * =============================================================================
 * BAWSALA (بوصلة العقار) - SHARED MOTION SYSTEM CONFIGURATION
 * =============================================================================
 * 
 * Rules:
 * 1. Global easing:
 *    - Entrances: cubic-bezier(0.22, 1, 0.36, 1)
 *    - Transitions: cubic-bezier(0.65, 0, 0.35, 1)
 * 2. Durations:
 *    - micro: 200ms (0.2s)
 *    - standard: 600ms (0.6s)
 *    - hero: 1200ms (1.2s)
 * 3. Scroll reveals: fade + 24px rise + slight blur-to-sharp.
 * 4. Respect prefers-reduced-motion (replace with simple fades).
 * 5. Animate only transform and opacity for 60fps.
 */

// Global Easing Curves
export const EASING = {
  entrance: [0.22, 1, 0.36, 1] as const,
  transition: [0.65, 0, 0.35, 1] as const,
};

export const EASING_CSS = {
  entrance: "cubic-bezier(0.22, 1, 0.36, 1)",
  transition: "cubic-bezier(0.65, 0, 0.35, 1)",
};

// Durations in Seconds (for Framer Motion) and Milliseconds (for CSS/JS timers)
export const DURATION = {
  micro: 0.2,
  standard: 0.6,
  hero: 1.2,
};

export const DURATION_MS = {
  micro: 200,
  standard: 600,
  hero: 1200,
};

// Base Framer Motion Transitions
export const TRANSITIONS = {
  micro: {
    duration: DURATION.micro,
    ease: EASING.transition,
  } satisfies Transition,

  standard: {
    duration: DURATION.standard,
    ease: EASING.entrance,
  } satisfies Transition,

  hero: {
    duration: DURATION.hero,
    ease: EASING.entrance,
  } satisfies Transition,

  reduced: {
    duration: DURATION.standard,
    ease: "linear",
  } satisfies Transition,
};

// =============================================================================
// Framer Motion Animation Variants
// =============================================================================

/**
 * Standard Scroll Reveal:
 * Fade + 24px rise + slight blur-to-sharp.
 * Animates strictly transform, opacity, and subtle filter for 60fps.
 */
export const scrollRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: TRANSITIONS.standard,
  },
};

/**
 * Pure 60fps transform + opacity (without blur filter)
 */
export const scrollReveal60fpsVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITIONS.standard,
  },
};

/**
 * Hero Section Entrance:
 * Slower 1200ms majestic entrance with 24px rise and blur clearing
 */
export const heroEntranceVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: TRANSITIONS.hero,
  },
};

/**
 * Micro Interaction Hover & Tap Variants
 */
export const microInteractionVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    transition: TRANSITIONS.micro,
  },
  hover: {
    y: -3,
    transition: TRANSITIONS.micro,
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: TRANSITIONS.micro,
  },
};

/**
 * Simple Fade (Default Fallback for prefers-reduced-motion)
 */
export const simpleFadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: DURATION.standard,
    },
  },
};

/**
 * Stagger Container for list & grid animations
 */
export const staggerContainerVariants = (
  staggerChildren = 0.08,
  delayChildren = 0
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

/**
 * Helper to select accessible variants based on prefers-reduced-motion
 */
export function getAccessibleVariant(
  variant: Variants,
  shouldReduceMotion: boolean
): Variants {
  if (!shouldReduceMotion) return variant;

  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: DURATION.standard },
    },
  };
}
