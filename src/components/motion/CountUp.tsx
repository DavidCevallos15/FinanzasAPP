import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { MOTION_DURATION } from '../../lib/motion';

interface CountUpProps {
  value: number;
  formatter: (val: number) => string;
  className?: string;
}

export function CountUp({ value, formatter, className }: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    let rafId = 0;
    const durationMs = MOTION_DURATION.countUp * 1000;
    const initialValue = 0;

    const step = (timestamp: number) => {
      if (startTimestamp === null) {
        startTimestamp = timestamp;
      }
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);
      // Curva ease-out cúbica
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = initialValue + (value - initialValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [value, reduceMotion]);

  return <span className={className}>{formatter(displayValue)}</span>;
}
