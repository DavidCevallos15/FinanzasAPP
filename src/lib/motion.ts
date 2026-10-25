export const MOTION_DURATION = {
  feedback: 0.16,
  interactive: 0.24,
  disclosure: 0.32,
  countUp: 0.6,
  budgetBar: 0.5,
  reveal: 0.98
} as const;

export const MOTION_EASE = {
  out: [0.23, 1, 0.32, 1] as const,
  inOut: [0.77, 0, 0.175, 1] as const,
  drawer: [0.32, 0.72, 0, 1] as const
} as const;

export const MOTION_TRANSITION = {
  feedback: {
    duration: MOTION_DURATION.feedback,
    ease: MOTION_EASE.out
  },
  interactive: {
    duration: MOTION_DURATION.interactive,
    ease: MOTION_EASE.out
  },
  disclosure: {
    duration: MOTION_DURATION.disclosure,
    ease: MOTION_EASE.inOut
  },
  reveal: {
    duration: MOTION_DURATION.reveal,
    ease: MOTION_EASE.out
  }
} as const;
