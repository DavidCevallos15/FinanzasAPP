import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { MOTION_DURATION, MOTION_EASE } from '../../lib/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      onClick={onClose}
    >
      <motion.div
        initial={
          reduceMotion
            ? { opacity: 0 }
            : { opacity: 0, transform: 'scale(0.96) translateY(8px)' }
        }
        animate={
          reduceMotion
            ? { opacity: 1 }
            : { opacity: 1, transform: 'scale(1) translateY(0px)' }
        }
        transition={{
          duration: MOTION_DURATION.disclosure,
          ease: MOTION_EASE.out
        }}
        className="w-full max-w-lg rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 id="modal-titulo" className="text-lg font-bold text-text">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="tappable flex h-11 w-11 -mr-2 -mt-2 items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-bg"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div>{children}</div>
      </motion.div>
    </div>
  );
}
