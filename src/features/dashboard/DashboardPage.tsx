import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Settings2, Target } from 'lucide-react';
import { BudgetBar } from '../../components/motion/BudgetBar';
import { CountUp } from '../../components/motion/CountUp';
import { Reveal } from '../../components/motion/Reveal';
import { BadgeEstado } from '../../components/ui/BadgeEstado';
import { useCategorias, useMovimientos } from '../../db/hooks';
import { calcularDashboardMes } from '../../domain/calculations';
import { cn } from '../../lib/cn';
import {
  formatCentavos,
  formatEtiquetaMes,
  formatPorcentaje,
  mesActualClave
} from '../../lib/format';
import { BarComparisonChart, CategoryDonutChart } from './Charts';

function desplazarMes(claveMes: string, deltaMeses: number): string {
  const [yStr, mStr] = claveMes.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return claveMes;
  const fecha = new Date(y, m - 1 + deltaMeses, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

export function DashboardPage() {
  const movimientos = useMovimientos();
  const categorias = useCategorias();
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(mesActualClave());

  const dash = useMemo(
    () => calcularDashboardMes(movimientos, categorias, mesSeleccionado),
    [movimientos, categorias, mesSeleccionado]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">Dashboard</h1>
          <p className="text-sm text-text-muted">Cómo va {dash.etiquetaMes} y en qué se te va la plata.</p>
        </div>

        <div className="flex items-center gap-2">
          {mesSeleccionado !== mesActualClave() && (
            <button
              type="button"
              onClick={() => setMesSeleccionado(mesActualClave())}
              className="tappable min-h-[44px] rounded-full pill-plum px-4 py-2 text-xs font-semibold text-sand"
            >
              Volver a hoy
            </button>
          )}

          <div className="inline-flex items-center gap-1 rounded-full bg-bg-deep p-1">
            <button
              type="button"
              onClick={() => setMesSeleccionado((m) => desplazarMes(m, -1))}
              aria-label="Mes anterior"
              className="tappable flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:text-text hover:bg-card"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="min-w-[96px] text-center text-sm font-bold text-text px-1">
              {formatEtiquetaMes(mesSeleccionado)}
            </span>
            <button
              type="button"
              onClick={() => setMesSeleccionado((m) => desplazarMes(m, 1))}
              aria-label="Mes siguiente"
              className="tappable flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:text-text hover:bg-card"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Ticket del mes: el recibo de papel es la pieza protagonista */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <Reveal className="lg:col-span-7">
          <article className="ticket ticket-notched h-full px-6 sm:px-8 py-6 flex flex-col" style={{ '--notch-y': '58%' } as React.CSSProperties}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-ink-muted">Saldo de {dash.etiquetaMes}</p>
                <p
                  className={cn(
                    'font-mono text-4xl sm:text-5xl font-bold tracking-tight mt-1',
                    dash.saldoMesCentavos < 0 ? 'text-[#8f2a3f]' : 'text-ink'
                  )}
                >
                  <CountUp value={dash.saldoMesCentavos} formatter={(v) => formatCentavos(Math.round(v))} />
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-ink-muted">Gastado</p>
                <p className="font-mono text-2xl font-bold text-ink mt-1">
                  <CountUp value={dash.porcentajeGastadoMes} formatter={(v) => formatPorcentaje(v)} />
                </p>
              </div>
            </div>

            <hr className="ticket-dash my-5" />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-ink-muted">Ingresos</p>
                <p className="font-mono text-lg font-bold text-ink">
                  <CountUp value={dash.ingresosMesCentavos} formatter={(v) => formatCentavos(Math.round(v))} />
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Gastos</p>
                <p className="font-mono text-lg font-bold text-ink">
                  <CountUp value={dash.gastosMesCentavos} formatter={(v) => formatCentavos(Math.round(v))} />
                </p>
              </div>
            </div>

            <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-ink text-sand px-4 py-2 text-sm font-bold">
                  {dash.estadoMes.codigo}
                </span>
                <p className="text-sm text-ink-muted max-w-[22ch] leading-snug">{dash.estadoMes.descripcion}</p>
              </div>
            </div>
          </article>
        </Reveal>

        <Reveal delay={0.05} className="lg:col-span-5 grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="panel p-4 sm:p-5 flex flex-col justify-between">
            <p className="text-sm text-text-muted">Saldo acumulado</p>
            <p
              className={cn(
                'font-mono text-xl sm:text-2xl font-bold mt-2',
                dash.saldoAcumuladoCentavos < 0 ? 'text-mal' : 'text-text'
              )}
            >
              <CountUp value={dash.saldoAcumuladoCentavos} formatter={(v) => formatCentavos(Math.round(v))} />
            </p>
          </div>
          <div className="panel p-4 sm:p-5 flex flex-col justify-between">
            <p className="text-sm text-text-muted">Ingresos {dash.anioClave}</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-ok mt-2">
              <CountUp value={dash.ingresosAnioCentavos} formatter={(v) => formatCentavos(Math.round(v))} />
            </p>
          </div>
          <div className="panel p-4 sm:p-5 flex flex-col justify-between col-span-2 lg:col-span-1">
            <p className="text-sm text-text-muted">Gastos {dash.anioClave}</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-coral mt-2">
              <CountUp value={dash.gastosAnioCentavos} formatter={(v) => formatCentavos(Math.round(v))} />
            </p>
          </div>
        </Reveal>
      </div>

      {/* Tabla / Tarjetas de Presupuesto por Categoría */}
      <Reveal className="panel p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-sand" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-text">
                Presupuesto del mes por categoría ({dash.etiquetaMes})
              </h2>
              <p className="text-xs text-text-muted">
                Compara tus gastos reales contra el presupuesto mensual asignado.
              </p>
            </div>
          </div>

          <Link
            to="/categorias"
            className="tappable min-h-[44px] inline-flex items-center gap-1.5 rounded-full pill-plum px-3.5 py-2 text-xs font-semibold text-sand self-start sm:self-auto"
          >
            <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Editar presupuestos</span>
          </Link>
        </div>

        {/* Vista en tarjetas para Móvil (<768px) */}
        <div className="md:hidden space-y-3">
          {dash.filasPresupuesto.map((fila) => (
            <div
              key={fila.categoria}
              className="panel-inset p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-text">{fila.categoria}</span>
                {fila.estado === '—' ? (
                  <span className="text-xs font-mono text-text-muted">—</span>
                ) : (
                  <BadgeEstado texto={fila.estado} nivel={fila.nivel} />
                )}
              </div>

              {(fila.presupuestoCentavos > 0 || fila.gastadoCentavos > 0) && (
                <BudgetBar
                  proporcion={
                    fila.porcentajeUsado ??
                    (fila.gastadoCentavos > 0 ? 1 : 0)
                  }
                  nivel={fila.nivel}
                  label={`Uso de presupuesto en ${fila.categoria}`}
                />
              )}

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div>
                  <span className="block text-text-muted">Presupuesto</span>
                  <span className="font-mono font-semibold text-text">
                    {formatCentavos(fila.presupuestoCentavos)}
                  </span>
                </div>
                <div>
                  <span className="block text-text-muted">Gastado</span>
                  <span className="font-mono font-semibold text-mal">
                    {formatCentavos(fila.gastadoCentavos)}
                  </span>
                </div>
                <div>
                  <span className="block text-text-muted">Disponible</span>
                  <span
                    className={cn(
                      'font-mono font-semibold',
                      fila.disponibleCentavos < 0 ? 'text-mal' : 'text-ok'
                    )}
                  >
                    {formatCentavos(fila.disponibleCentavos)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Tarjeta TOTAL en móvil */}
          <div className="rounded-xl bg-sand/15 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-sand">TOTAL PRESUPUESTO</span>
              <span className="font-mono text-xs font-bold text-text">
                {dash.totalPresupuesto.porcentajeUsado !== null
                  ? `${formatPorcentaje(dash.totalPresupuesto.porcentajeUsado)} usado`
                  : '—'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="block text-text-muted">Presupuesto</span>
                <span className="font-mono font-bold text-text">
                  {formatCentavos(dash.totalPresupuesto.presupuestoCentavos)}
                </span>
              </div>
              <div>
                <span className="block text-text-muted">Gastado</span>
                <span className="font-mono font-bold text-mal">
                  {formatCentavos(dash.totalPresupuesto.gastadoCentavos)}
                </span>
              </div>
              <div>
                <span className="block text-text-muted">Disponible</span>
                <span
                  className={cn(
                    'font-mono font-bold',
                    dash.totalPresupuesto.disponibleCentavos < 0 ? 'text-mal' : 'text-ok'
                  )}
                >
                  {formatCentavos(dash.totalPresupuesto.disponibleCentavos)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla en Desktop (>=768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-xs font-medium text-text-muted">
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Presupuesto</th>
                <th className="py-3 px-4 text-right">Gastado (mes)</th>
                <th className="py-3 px-4 text-right">Disponible</th>
                <th className="py-3 px-4 w-44">% usado</th>
                <th className="py-3 px-4 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {dash.filasPresupuesto.map((fila) => (
                <tr key={fila.categoria} className="hover:bg-bg/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-text">{fila.categoria}</td>
                  <td className="py-3 px-4 text-right font-mono text-text">
                    {formatCentavos(fila.presupuestoCentavos)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-mal">
                    {formatCentavos(fila.gastadoCentavos)}
                  </td>
                  <td
                    className={cn(
                      'py-3 px-4 text-right font-mono font-semibold',
                      fila.disponibleCentavos < 0 ? 'text-mal' : 'text-text'
                    )}
                  >
                    {formatCentavos(fila.disponibleCentavos)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <span className="block font-mono text-xs text-right text-text-muted">
                        {fila.porcentajeUsado !== null
                          ? formatPorcentaje(fila.porcentajeUsado)
                          : '—'}
                      </span>
                      <BudgetBar
                        proporcion={
                          fila.porcentajeUsado ??
                          (fila.gastadoCentavos > 0 ? 1 : 0)
                        }
                        nivel={fila.nivel}
                        label={`Progreso de ${fila.categoria}`}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {fila.estado === '—' ? (
                      <span className="font-mono text-xs text-text-muted">—</span>
                    ) : (
                      <BadgeEstado texto={fila.estado} nivel={fila.nivel} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border/60 font-bold text-sm">
                <td className="py-3.5 px-4 text-sand">TOTAL</td>
                <td className="py-3.5 px-4 text-right font-mono text-text">
                  {formatCentavos(dash.totalPresupuesto.presupuestoCentavos)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-mal">
                  {formatCentavos(dash.totalPresupuesto.gastadoCentavos)}
                </td>
                <td
                  className={cn(
                    'py-3.5 px-4 text-right font-mono',
                    dash.totalPresupuesto.disponibleCentavos < 0 ? 'text-mal' : 'text-ok'
                  )}
                >
                  {formatCentavos(dash.totalPresupuesto.disponibleCentavos)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-text">
                  {dash.totalPresupuesto.porcentajeUsado !== null
                    ? formatPorcentaje(dash.totalPresupuesto.porcentajeUsado)
                    : '—'}
                </td>
                <td className="py-3.5 px-4" />
              </tr>
            </tfoot>
          </table>
        </div>
      </Reveal>

      {/* Gráficos SVG propios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal>
          <BarComparisonChart
            titulo={`Ingresos vs Gastos — Semanas de ${dash.etiquetaMes}`}
            subtitulo="Agrupado por semana (lunes a domingo) del mes seleccionado"
            datos={dash.semanasDelMes}
          />
        </Reveal>

        <Reveal delay={0.04}>
          <BarComparisonChart
            titulo="Ingresos vs Gastos — Por mes"
            subtitulo="Evolución mensual (hasta los últimos 12 meses)"
            datos={dash.ultimosDoceMeses}
          />
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <CategoryDonutChart
          datos={dash.gastosPorCategoriaMes}
          totalGastoCentavos={dash.gastosMesCentavos}
          etiquetaMes={dash.etiquetaMes}
        />
      </Reveal>
    </div>
  );
}
