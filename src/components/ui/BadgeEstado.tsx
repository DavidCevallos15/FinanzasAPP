import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  HelpCircle,
  OctagonAlert,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../../lib/cn';

export type NivelEstadoVisual =
  | 'ok'
  | 'alerta'
  | 'riesgo'
  | 'mal'
  | 'neutro'
  | 'revisar';

interface BadgeEstadoProps {
  texto: string;
  nivel: NivelEstadoVisual;
  className?: string;
}

const ESTILOS_NIVEL: Record<NivelEstadoVisual, string> = {
  ok: 'bg-ok/15 text-ok border-ok/30',
  alerta: 'bg-alerta/15 text-alerta border-alerta/30',
  riesgo: 'bg-riesgo/15 text-riesgo border-riesgo/30',
  mal: 'bg-mal/15 text-mal border-mal/30',
  neutro: 'bg-border/60 text-text-muted border-border',
  revisar: 'bg-alerta/15 text-alerta border-alerta/40'
};

function IconoNivel({ nivel }: { nivel: NivelEstadoVisual }) {
  const iconClass = 'h-3.5 w-3.5 shrink-0';
  switch (nivel) {
    case 'ok':
      return <CheckCircle2 className={iconClass} aria-hidden="true" />;
    case 'alerta':
      return <AlertTriangle className={iconClass} aria-hidden="true" />;
    case 'riesgo':
      return <ShieldAlert className={iconClass} aria-hidden="true" />;
    case 'mal':
      return <OctagonAlert className={iconClass} aria-hidden="true" />;
    case 'revisar':
      return <AlertCircle className={iconClass} aria-hidden="true" />;
    case 'neutro':
      return <CircleDashed className={iconClass} aria-hidden="true" />;
    default:
      return <HelpCircle className={iconClass} aria-hidden="true" />;
  }
}

export function BadgeEstado({ texto, nivel, className }: BadgeEstadoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-none whitespace-nowrap',
        ESTILOS_NIVEL[nivel],
        className
      )}
    >
      <IconoNivel nivel={nivel} />
      <span>{texto}</span>
    </span>
  );
}
