import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Pencil,
  RotateCcw,
  Search,
  Trash2
} from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { Modal } from '../../components/ui/Modal';
import { useCategorias, useMovimientos } from '../../db/hooks';
import { eliminarMovimiento } from '../../db/repositories';
import type { MovimientoRecord } from '../../db/types';
import { cn } from '../../lib/cn';
import { formatCentavos, formatEtiquetaMes, formatFechaCorta } from '../../lib/format';
import { normalizarTexto } from '../../lib/money';
import { MovimientoForm } from './MovimientoForm';

export function MovimientosPage() {
  const movimientos = useMovimientos();
  const categorias = useCategorias();

  const [busqueda, setBusqueda] = useState('');
  const [mesFiltro, setMesFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | 'Ingreso' | 'Gasto'>('TODOS');
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');

  const [movimientoEditar, setMovimientoEditar] = useState<MovimientoRecord | null>(null);
  const [movimientoPorEliminar, setMovimientoPorEliminar] = useState<MovimientoRecord | null>(null);

  const categoriasFiltrables = useMemo(() => {
    const nombres = new Set<string>();
    categorias.forEach((c) => {
      if (tipoFiltro === 'TODOS' || c.tipo === tipoFiltro) {
        nombres.add(c.nombre);
      }
    });
    movimientos.forEach((m) => {
      if (tipoFiltro === 'TODOS' || m.tipo === tipoFiltro) {
        nombres.add(m.categoria);
      }
    });
    return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
  }, [categorias, movimientos, tipoFiltro]);

  const movimientosFiltrados = useMemo(() => {
    const q = normalizarTexto(busqueda);
    return movimientos.filter((m) => {
      if (mesFiltro && !m.fecha.startsWith(mesFiltro)) return false;
      if (tipoFiltro !== 'TODOS' && m.tipo !== tipoFiltro) return false;
      if (categoriaFiltro !== 'TODAS' && m.categoria !== categoriaFiltro) return false;
      if (q) {
        const textoFila = normalizarTexto(
          `${m.categoria} ${m.descripcion} ${m.observacion} ${m.metodo}`
        );
        if (!textoFila.includes(q)) return false;
      }
      return true;
    });
  }, [movimientos, mesFiltro, tipoFiltro, categoriaFiltro, busqueda]);

  const resumenFiltro = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    for (const m of movimientosFiltrados) {
      if (m.tipo === 'Ingreso') ingresos += m.montoCentavos;
      else gastos += m.montoCentavos;
    }
    return { ingresos, gastos, saldo: ingresos - gastos };
  }, [movimientosFiltrados]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setMesFiltro('');
    setTipoFiltro('TODOS');
    setCategoriaFiltro('TODAS');
  };

  const confirmarEliminacion = async () => {
    if (!movimientoPorEliminar) return;
    await eliminarMovimiento(movimientoPorEliminar.id);
    setMovimientoPorEliminar(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Movimientos
          </h1>
          <p className="text-sm text-text-muted">
            Historial detallado con filtros por mes, tipo, categoría y búsqueda de texto.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="rounded-lg bg-ok/15 border border-ok/30 px-2.5 py-1 text-ok">
            Ingresos: {formatCentavos(resumenFiltro.ingresos)}
          </span>
          <span className="rounded-lg bg-mal/15 border border-mal/30 px-2.5 py-1 text-mal">
            Gastos: {formatCentavos(resumenFiltro.gastos)}
          </span>
        </div>
      </header>

      <Reveal className="panel p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
            <Filter className="h-4 w-4 text-coral" aria-hidden="true" />
            <span>Filtros ({movimientosFiltrados.length} resultado{movimientosFiltrados.length === 1 ? '' : 's'})</span>
          </div>
          {(busqueda || mesFiltro || tipoFiltro !== 'TODOS' || categoriaFiltro !== 'TODAS') && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="tappable inline-flex items-center gap-1.5 text-xs font-medium text-sand hover:underline py-1"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Quitar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label
              htmlFor="filtro-texto"
              className="block text-xs font-medium text-text-muted mb-1"
            >
              Buscar texto
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
                aria-hidden="true"
              />
              <input
                id="filtro-texto"
                type="search"
                placeholder="Descripción, nota, método..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="field w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-base text-text"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="filtro-mes"
              className="block text-xs font-medium text-text-muted mb-1"
            >
              Mes (vacío = todos)
            </label>
            <input
              id="filtro-mes"
              type="month"
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className="field w-full min-h-[44px] px-3.5 py-2.5 font-mono text-base text-text"
            />
          </div>

          <div>
            <label
              htmlFor="filtro-tipo"
              className="block text-xs font-medium text-text-muted mb-1"
            >
              Tipo
            </label>
            <select
              id="filtro-tipo"
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value as 'TODOS' | 'Ingreso' | 'Gasto');
                setCategoriaFiltro('TODAS');
              }}
              className="field w-full min-h-[44px] px-3.5 py-2.5 text-base text-text"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="Ingreso">Solo Ingresos</option>
              <option value="Gasto">Solo Gastos</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-categoria"
              className="block text-xs font-medium text-text-muted mb-1"
            >
              Categoría
            </label>
            <select
              id="filtro-categoria"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="field w-full min-h-[44px] px-3.5 py-2.5 text-base text-text"
            >
              <option value="TODAS">Todas las categorías</option>
              {categoriasFiltrables.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Reveal>

      {movimientosFiltrados.length === 0 ? (
        <Reveal delay={0.05} className="panel p-8 text-center space-y-2">
          <p className="text-base font-semibold text-text">
            {mesFiltro
              ? `No hay movimientos en ${formatEtiquetaMes(mesFiltro)} con esos filtros`
              : 'No se encontraron movimientos'}
          </p>
          <p className="text-xs text-text-muted">
            Prueba ajustando los filtros o registra un nuevo movimiento en la pestaña Inicio.
          </p>
        </Reveal>
      ) : (
        <>
          {/* Tarjetas en Móvil (<768px) */}
          <div className="md:hidden space-y-3">
            {movimientosFiltrados.map((mov) => {
              const esIngreso = mov.tipo === 'Ingreso';
              return (
                <div
                  key={mov.id}
                  className="panel p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
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
                        <span className="inline-block text-sm font-bold text-text">
                          {mov.categoria}
                        </span>
                        <p className="text-xs text-text-muted">
                          {formatFechaCorta(mov.fecha)} · {mov.metodo || 'Sin método'}
                        </p>
                      </div>
                    </div>

                    <p
                      className={cn(
                        'font-mono text-base font-bold shrink-0',
                        esIngreso ? 'text-ok' : 'text-mal'
                      )}
                    >
                      {esIngreso ? '+' : '-'}
                      {formatCentavos(mov.montoCentavos)}
                    </p>
                  </div>

                  {(mov.descripcion || mov.observacion) && (
                    <div className="text-xs text-text-muted space-y-0.5 bg-bg/60 rounded-xl p-2.5 border border-border/60">
                      {mov.descripcion && (
                        <p className="text-text font-medium">{mov.descripcion}</p>
                      )}
                      {mov.observacion && <p>Nota: {mov.observacion}</p>}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setMovimientoEditar(mov)}
                      className="tappable min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 panel-inset px-3 py-2 text-xs font-semibold text-text"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovimientoPorEliminar(mov)}
                      className="tappable min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-mal/15 px-3 py-2 text-xs font-semibold text-mal"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla en Desktop (>=768px) */}
          <Reveal className="hidden md:block panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-xs font-medium text-text-muted">
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Descripción / Nota</th>
                    <th className="py-3.5 px-4">Método</th>
                    <th className="py-3.5 px-4 text-right">Monto</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {movimientosFiltrados.map((mov) => {
                    const esIngreso = mov.tipo === 'Ingreso';
                    return (
                      <tr key={mov.id} className="hover:bg-bg/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-text-muted whitespace-nowrap">
                          {formatFechaCorta(mov.fecha)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                              esIngreso
                                ? 'bg-ok/15 border-ok/30 text-ok'
                                : 'bg-mal/15 border-mal/30 text-mal'
                            )}
                          >
                            {esIngreso ? (
                              <ArrowDownLeft className="h-3 w-3" aria-hidden="true" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                            )}
                            <span>{mov.tipo}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-text whitespace-nowrap">
                          {mov.categoria}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-text truncate">
                            {mov.descripcion || '—'}
                          </p>
                          {mov.observacion && (
                            <p className="text-xs text-text-muted truncate">
                              {mov.observacion}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-text-muted whitespace-nowrap">
                          {mov.metodo || '—'}
                        </td>
                        <td
                          className={cn(
                            'py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap',
                            esIngreso ? 'text-ok' : 'text-mal'
                          )}
                        >
                          {esIngreso ? '+' : '-'}
                          {formatCentavos(mov.montoCentavos)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setMovimientoEditar(mov)}
                              aria-label={`Editar movimiento de ${mov.categoria}`}
                              className="tappable min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full pill-plum "
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMovimientoPorEliminar(mov)}
                              aria-label={`Eliminar movimiento de ${mov.categoria}`}
                              className="tappable min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full bg-mal/15 text-mal hover:bg-mal/25"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
        </>
      )}

      {/* Modal de Edición */}
      <Modal
        open={Boolean(movimientoEditar)}
        onClose={() => setMovimientoEditar(null)}
        title="Editar movimiento"
        description="Modifica los campos y guarda para actualizar el registro."
      >
        {movimientoEditar && (
          <MovimientoForm
            categorias={categorias}
            movimientoEditar={movimientoEditar}
            onGuardado={() => setMovimientoEditar(null)}
            onCancelarEdicion={() => setMovimientoEditar(null)}
          />
        )}
      </Modal>

      {/* Modal de Eliminación */}
      <Modal
        open={Boolean(movimientoPorEliminar)}
        onClose={() => setMovimientoPorEliminar(null)}
        title="Eliminar movimiento"
        description="Esta acción eliminará el registro de forma permanente."
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
