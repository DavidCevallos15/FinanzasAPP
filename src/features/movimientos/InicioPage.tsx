import { useMemo, useState } from 'react';
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
import { formatCentavos, formatEtiquetaMes, formatFechaCorta, mesActualClave } from '../../lib/format';
import { MovimientoForm } from './MovimientoForm';

export function InicioPage() {
  const categorias = useCategorias();
  const movimientos = useMovimientos();
  const [movimientoEditar, setMovimientoEditar] = useState<MovimientoRecord | null>(null);
  const [movimientoPorEliminar, setMovimientoPorEliminar] = useState<MovimientoRecord | null>(null);

  const ultimosCinco = movimientos.slice(0, 5);
  const mesClave = mesActualClave();
  const resumenMes = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    for (const m of movimientos) {
      if (!m.fecha.startsWith(mesClave)) continue;
      if (m.tipo === 'Ingreso') ingresos += m.montoCentavos;
      else gastos += m.montoCentavos;
    }
    return { ingresos, gastos, saldo: ingresos - gastos };
  }, [movimientos, mesClave]);

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
          <p className="text-sm text-text-muted">{formatEtiquetaMes(mesClave)}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Anota la plata que entra y sale
          </h1>
        </div>
      </header>

      {/* Resumen del mes en el recibo de arena */}
      <Reveal>
        <section
          aria-label="Resumen del mes en curso"
          className="ticket px-5 sm:px-7 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        >
          <div>
            <p className="text-sm text-ink-muted">Gastado este mes</p>
            <p className="font-mono text-4xl font-bold tracking-tight text-ink mt-0.5">
              {formatCentavos(resumenMes.gastos)}
            </p>
            <p className="text-sm text-ink-muted mt-1.5">
              de {formatCentavos(resumenMes.ingresos)} que entraron ·{' '}
              <span className="font-semibold text-ink">
                saldo {formatCentavos(resumenMes.saldo)}
              </span>
            </p>
          </div>
          <Link
            to="/dashboard"
            className="tappable tappable-hover inline-flex items-center justify-center gap-2 min-h-[48px] rounded-full bg-ink px-6 py-3 text-sm font-bold text-sand shadow-[var(--shadow-pill)] self-start sm:self-auto"
          >
            <span>Ver el mes completo</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </Reveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Reveal className="lg:col-span-7 panel p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              {movimientoEditar ? (
                <Pencil className="h-5 w-5 text-alerta" aria-hidden="true" />
              ) : (
                <PlusCircle className="h-5 w-5 text-sand" aria-hidden="true" />
              )}
              <h2 className="text-base font-semibold text-text">
                {movimientoEditar ? 'Editando movimiento' : 'Nuevo movimiento'}
              </h2>
            </div>
            {movimientoEditar && (
              <span className="rounded-full bg-alerta/20 px-3 py-1 text-xs font-semibold text-alerta">
                Editando
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

        <Reveal delay={0.05} className="lg:col-span-5 panel p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-coral" aria-hidden="true" />
              <h2 className="text-base font-semibold text-text">Últimos 5 movimientos</h2>
            </div>
            <Link
              to="/movimientos"
              className="tappable inline-flex items-center gap-1 text-xs font-medium text-coral hover:underline py-1"
            >
              <span>Ver todos ({movimientos.length})</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {ultimosCinco.length === 0 ? (
            <div className="panel-inset border border-dashed border-border/60 p-6 text-center space-y-2">
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

                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-end gap-2">
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
            <div className="panel-inset p-3.5 space-y-1 text-sm">
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
                className="tappable min-h-[44px] rounded-full pill-plum px-4 py-2 text-sm font-medium "
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarEliminacion()}
                className="tappable min-h-[44px] rounded-full pill-coral px-4 py-2 text-sm font-bold "
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
