/**
 * Bawsala Global Motion System Tokens & Variants
 * Consistent motion vocabulary across all screens & components.
 */

export const MOTION_DURATIONS = {
  micro: 0.15,      // 150ms
  standard: 0.3,    // 300ms
  emphasis: 0.5,    // 500ms
  hero: 0.9,        // 900ms
  reduced: 0.2,     // 200ms fallback for prefers-reduced-motion
} as const;

export const MOTION_EASINGS = {
  default: [0.22, 1, 0.36, 1] as const, // cubic-bezier(0.22, 1, 0.36, 1)
  easeOut: [0, 0, 0.2, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
};

export const MOTION_SPRINGS = {
  sheet: {
    type: "spring" as const,
    stiffness: 140,
    damping: 20,
    mass: 0.8,
  },
  toggle: {
    type: "spring" as const,
    stiffness: 160,
    damping: 22,
  },
  compassNeedle: {
    type: "spring" as const,
    stiffness: 130,
    damping: 19,
  },
  gentle: {
    type: "spring" as const,
    stiffness: 120,
    damping: 18,
  },
  default: {
    type: "spring" as const,
    stiffness: 150,
    damping: 22,
  },
};

/**
 * Button tap/hover motion: button press 0.97
 */
export const buttonMotion = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.97 },
  transition: {
    duration: MOTION_DURATIONS.micro,
    ease: MOTION_EASINGS.default,
  },
};

/**
 * Chip state pop
 */
export const chipMotion = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.95 },
  transition: {
    duration: MOTION_DURATIONS.micro,
    ease: MOTION_EASINGS.default,
  },
};

/**
 * Card hover/press motion: lift 2px with deeper shadow
 */
export const cardMotion = {
  initial: { y: 0, opacity: 1 },
  whileHover: {
    y: -2,
    transition: {
      duration: MOTION_DURATIONS.standard,
      ease: MOTION_EASINGS.default,
    },
  },
  whileTap: {
    y: 0,
    scale: 0.99,
    transition: {
      duration: MOTION_DURATIONS.micro,
    },
  },
};

/**
 * Staggered container and list items
 */
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06, // 60ms stagger
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.emphasis,
      ease: MOTION_EASINGS.default,
    },
  },
};

/**
 * RTL-Aware Page Transitions
 * In RTL, forward journey enters from the left (x: -12), backward from the right (x: 12).
 */
export const pageTransitionVariants = {
  initial: (direction: "forward" | "backward" = "forward") => ({
    opacity: 0,
    x: direction === "forward" ? -12 : 12,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: MOTION_DURATIONS.standard,
      ease: MOTION_EASINGS.default,
    },
  },
  exit: (direction: "forward" | "backward" = "forward") => ({
    opacity: 0,
    x: direction === "forward" ? 12 : -12,
    transition: {
      duration: MOTION_DURATIONS.micro,
      ease: MOTION_EASINGS.default,
    },
  }),
};

/**
 * Bottom Sheet Variants
 */
export const bottomSheetVariants = {
  hidden: {
    y: "100%",
    opacity: 0.7,
  },
  visible: {
    y: "0%",
    opacity: 1,
    transition: MOTION_SPRINGS.sheet,
  },
  exit: {
    y: "100%",
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.standard,
      ease: MOTION_EASINGS.default,
    },
  },
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATIONS.standard },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATIONS.micro },
  },
};

/**
 * Reduced-motion fallback variants
 */
export const reducedMotionFadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATIONS.reduced },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATIONS.reduced },
  },
};
