import { motion, useReducedMotion } from 'motion/react';
import type { NivelEstadoVisual } from '../ui/BadgeEstado';
import { cn } from '../../lib/cn';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion';

interface BudgetBarProps {
  proporcion: number;
  nivel: NivelEstadoVisual;
  label?: string;
}

const COLOR_BARRA: Record<NivelEstadoVisual, string> = {
  ok: 'bg-ok',
  alerta: 'bg-alerta',
  riesgo: 'bg-riesgo',
  mal: 'bg-mal',
  revisar: 'bg-alerta',
  neutro: 'bg-accent-cyan'
};

export function BudgetBar({ proporcion, nivel, label }: BudgetBarProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(proporcion, 1));

  return (
    <div
      className="h-2 w-full rounded-full bg-bg overflow-hidden border border-border/60"
      role="progressbar"
      aria-label={label ?? 'Progreso de presupuesto'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(proporcion * 100)}
    >
      {reduceMotion ? (
        <div
          className={cn('h-full rounded-full', COLOR_BARRA[nivel])}
          style={{ width: `${clamped * 100}%` }}
        />
      ) : (
        <motion.div
          className={cn('h-full w-full rounded-full origin-left', COLOR_BARRA[nivel])}
          initial={{ transform: 'scaleX(0)' }}
          animate={{ transform: `scaleX(${clamped})` }}
          transition={{
            duration: MOTION_DURATION.budgetBar,
            ease: MOTION_EASE.out
          }}
        />
      )}
    </div>
  );
}
