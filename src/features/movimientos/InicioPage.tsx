import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Pencil,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { Modal } from '../../components/ui/Modal';
import { useCategorias, useMovimientos } from '../../db/hooks';
import { eliminarMovimiento } from '../../db/repositories';
import type { MovimientoRecord } from '../../db/types';
import { cn } from '../../lib/cn';
import { formatCentavos, formatFechaCorta } from '../../lib/format';
import { MovimientoForm } from './MovimientoForm';

export function InicioPage() {
  const categorias = useCategorias();
  const movimientos = useMovimientos();
  const [movimientoEditar, setMovimientoEditar] = useState<MovimientoRecord | null>(null);
  const [movimientoPorEliminar, setMovimientoPorEliminar] = useState<MovimientoRecord | null>(null);

  const ultimosCinco = movimientos.slice(0, 5);

  const confirmarEliminacion = async () => {
    if (!movimientoPorEliminar) return;
    const idBorrar = movimientoPorEliminar.id;
    await eliminarMovimiento(idBorrar);
    if (movimientoEditar?.id === idBorrar) {
      setMovimientoEditar(null);
    }
    setMovimientoPorEliminar(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Registrar movimiento
          </h1>
          <p className="text-sm text-text-muted">
            Crea, edita y elimina tus ingresos y gastos. Todo se guarda localmente al instante.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Reveal className="lg:col-span-7 bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              {movimientoEditar ? (
                <Pencil className="h-5 w-5 text-alerta" aria-hidden="true" />
              ) : (
                <PlusCircle className="h-5 w-5 text-accent-gold" aria-hidden="true" />
              )}
              <h2 className="text-base font-semibold text-text">
                {movimientoEditar ? 'Editando movimiento' : 'Nuevo movimiento'}
              </h2>
            </div>
            {movimientoEditar && (
              <span className="rounded-full bg-alerta/15 border border-alerta/30 px-2.5 py-0.5 text-xs font-mono text-alerta">
                Modo edición
              </span>
            )}
          </div>

          <MovimientoForm
            categorias={categorias}
            movimientoEditar={movimientoEditar}
            onGuardado={(_rec, eraEdicion) => {
              if (eraEdicion) {
                setMovimientoEditar(null);
              }
            }}
            onCancelarEdicion={() => setMovimientoEditar(null)}
          />
        </Reveal>

        <Reveal delay={0.05} className="lg:col-span-5 bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
              <h2 className="text-base font-semibold text-text">Últimos 5 movimientos</h2>
            </div>
            <Link
              to="/movimientos"
              className="tappable inline-flex items-center gap-1 text-xs font-medium text-accent-cyan hover:underline py-1"
            >
              <span>Ver todos ({movimientos.length})</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {ultimosCinco.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-bg/50 p-6 text-center space-y-2">
              <p className="text-sm font-medium text-text">Aún no hay movimientos registrados</p>
              <p className="text-xs text-text-muted">
                Tus últimos 5 registros aparecerán aquí con botones rápidos para editar o eliminar.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {ultimosCinco.map((mov) => {
                const esIngreso = mov.tipo === 'Ingreso';
                const editandoEste = movimientoEditar?.id === mov.id;
                return (
                  <li
                    key={mov.id}
                    className={cn(
                      'rounded-xl bg-bg border p-3.5 transition-colors',
                      editandoEste ? 'border-alerta/60' : 'border-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                            esIngreso
                              ? 'bg-ok/15 border-ok/30 text-ok'
                              : 'bg-mal/15 border-mal/30 text-mal'
                          )}
                        >
                          {esIngreso ? (
                            <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text truncate">
                            {mov.categoria}
                          </p>
                          <p className="text-xs text-text-muted truncate">
                            {mov.descripcion || 'Sin descripción'} · {formatFechaCorta(mov.fecha)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            'font-mono text-sm font-bold',
                            esIngreso ? 'text-ok' : 'text-mal'
                          )}
                        >
                          {esIngreso ? '+' : '-'}
                          {formatCentavos(mov.montoCentavos)}
                        </p>
                        <span className="text-[11px] text-text-muted">{mov.metodo}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setMovimientoEditar(mov)}
                        className="tappable min-h-[44px] inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMovimientoPorEliminar(mov)}
                        className="tappable min-h-[44px] inline-flex items-center gap-1.5 rounded-lg bg-mal/10 border border-mal/30 px-3 py-1.5 text-xs font-medium text-mal hover:bg-mal/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Reveal>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Modal
        open={Boolean(movimientoPorEliminar)}
        onClose={() => setMovimientoPorEliminar(null)}
        title="Eliminar movimiento"
        description="Esta acción no se puede deshacer."
      >
        {movimientoPorEliminar && (
          <div className="space-y-4">
            <div className="rounded-xl bg-bg border border-border p-3.5 space-y-1 text-sm">
              <p className="font-semibold text-text">
                {movimientoPorEliminar.tipo}: {movimientoPorEliminar.categoria}
              </p>
              <p className="font-mono text-base font-bold text-mal">
                {formatCentavos(movimientoPorEliminar.montoCentavos)}
              </p>
              <p className="text-xs text-text-muted">
                Fecha: {formatFechaCorta(movimientoPorEliminar.fecha)} ·{' '}
                {movimientoPorEliminar.descripcion || 'Sin descripción'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMovimientoPorEliminar(null)}
                className="tappable min-h-[44px] rounded-xl bg-bg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarEliminacion()}
                className="tappable min-h-[44px] rounded-xl bg-mal px-4 py-2 text-sm font-bold text-bg"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
