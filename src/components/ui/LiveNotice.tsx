import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface AvisoEstado {
  tipo: 'exito' | 'error';
  mensaje: string;
}

interface LiveNoticeProps {
  aviso: AvisoEstado | null;
  onDismiss?: () => void;
}

export function LiveNotice({ aviso, onDismiss }: LiveNoticeProps) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {aviso && (
        <div
          role={aviso.tipo === 'error' ? 'alert' : 'status'}
          className={cn(
            'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
            aviso.tipo === 'exito'
              ? 'bg-ok/15 border-ok/35 text-ok'
              : 'bg-mal/15 border-mal/35 text-mal'
          )}
        >
          <div className="flex items-center gap-2.5">
            {aviso.tipo === 'exito' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{aviso.mensaje}</span>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Cerrar aviso"
              className="tappable flex h-8 w-8 items-center justify-center rounded-lg hover:bg-bg/30"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
