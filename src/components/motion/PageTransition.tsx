import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion';

interface PageTransitionProps {
  children: ReactNode;
  routeKey: string;
}

export function PageTransition({ children, routeKey }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={routeKey}
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, transform: 'translateY(6px)' }
      }
      animate={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, transform: 'translateY(0px)' }
      }
      transition={{
        duration: MOTION_DURATION.interactive,
        ease: MOTION_EASE.out
      }}
    >
      {children}
    </motion.div>
  );
}
