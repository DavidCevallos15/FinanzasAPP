import { useMemo } from 'react';
import { CalendarRange } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { BadgeEstado } from '../../components/ui/BadgeEstado';
import type { MovimientoRecord } from '../../db/types';
import { calcularHistorial } from '../../domain/calculations';
import { cn } from '../../lib/cn';
import { formatCentavos, formatPorcentaje } from '../../lib/format';

interface HistorialSectionProps {
  movimientos: readonly MovimientoRecord[];
}

export function HistorialSection({ movimientos }: HistorialSectionProps) {
  const historial = useMemo(() => calcularHistorial(movimientos), [movimientos]);

  return (
    <Reveal className="panel p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-2.5 pb-1">
        <CalendarRange className="h-5 w-5 text-sand" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-text">Historial por mes y por año</h2>
          <p className="text-xs text-text-muted">
            Calculado automáticamente desde tus movimientos. Si corriges un registro antiguo, el
            historial se actualiza al instante.
          </p>
        </div>
      </div>

      {historial.porMes.length === 0 ? (
        <div className="panel-inset border border-dashed border-border/60 p-6 text-center space-y-1">
          <p className="text-sm font-medium text-text">Aún no hay historial disponible</p>
          <p className="text-xs text-text-muted">
            Registra movimientos para ver el consolidado mensual y anual.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Historial Mensual */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-text-muted">
              Resumen por mes ({historial.porMes.length})
            </h3>

            {/* Tarjetas en Móvil (<768px) */}
            <div className="md:hidden space-y-2.5">
              {historial.porMes.map((m) => (
                <div
                  key={m.mesClave}
                  className="panel-inset p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-bold text-text">
                        {m.etiquetaMes}
                      </span>
                      <span className="ml-2 text-xs text-text-muted">
                        ({m.cantidadMovimientos} mov.)
                      </span>
                    </div>
                    <BadgeEstado texto={m.estado.codigo} nivel={m.estado.nivel} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-text-muted">Ingresos</span>
                      <span className="font-mono font-semibold text-ok">
                        {formatCentavos(m.ingresosCentavos)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-text-muted">Gastos</span>
                      <span className="font-mono font-semibold text-mal">
                        {formatCentavos(m.gastosCentavos)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-text-muted">Saldo</span>
                      <span
                        className={cn(
                          'font-mono font-bold',
                          m.saldoCentavos < 0 ? 'text-mal' : 'text-text'
                        )}
                      >
                        {formatCentavos(m.saldoCentavos)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-text-muted">% gastado</span>
                      <span className="font-mono font-semibold text-text">
                        {m.porcentajeGastado !== null
                          ? formatPorcentaje(m.porcentajeGastado)
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla en Desktop (>=768px) */}
            <div className="hidden md:block overflow-x-auto panel-inset">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-xs font-medium text-text-muted">
                    <th className="py-3 px-4">Mes</th>
                    <th className="py-3 px-4 text-right">Ingresos</th>
                    <th className="py-3 px-4 text-right">Gastos</th>
                    <th className="py-3 px-4 text-right">Saldo</th>
                    <th className="py-3 px-4 text-right">% gastado</th>
                    <th className="py-3 px-4 text-right">Estado</th>
                    <th className="py-3 px-4 text-right">Nº movimientos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {historial.porMes.map((m) => (
                    <tr key={m.mesClave} className="hover:bg-bg/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-text">
                        {m.etiquetaMes}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-ok">
                        {formatCentavos(m.ingresosCentavos)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-mal">
                        {formatCentavos(m.gastosCentavos)}
                      </td>
                      <td
                        className={cn(
                          'py-3 px-4 text-right font-mono font-bold',
                          m.saldoCentavos < 0 ? 'text-mal' : 'text-text'
                        )}
                      >
                        {formatCentavos(m.saldoCentavos)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-text-muted">
                        {m.porcentajeGastado !== null
                          ? formatPorcentaje(m.porcentajeGastado)
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <BadgeEstado texto={m.estado.codigo} nivel={m.estado.nivel} />
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-text-muted">
                        {m.cantidadMovimientos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historial Anual */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-text-muted">
              Consolidado por año ({historial.porAnio.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {historial.porAnio.map((a) => (
                <div
                  key={a.anio}
                  className="panel-inset p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="font-mono text-base font-bold text-sand">
                      Año {a.anio}
                    </span>
                    <span className="text-xs font-mono text-text-muted">
                      {a.cantidadMovimientos} mov.
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Ingresos:</span>
                      <span className="font-mono font-semibold text-ok">
                        {formatCentavos(a.ingresosCentavos)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Gastos:</span>
                      <span className="font-mono font-semibold text-mal">
                        {formatCentavos(a.gastosCentavos)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-border/40">
                      <span className="font-semibold text-text">Saldo anual:</span>
                      <span
                        className={cn(
                          'font-mono font-bold',
                          a.saldoCentavos < 0 ? 'text-mal' : 'text-text'
                        )}
                      >
                        {formatCentavos(a.saldoCentavos)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Reveal>
  );
}
