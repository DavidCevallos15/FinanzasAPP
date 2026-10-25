import { useState } from 'react';
import { ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { BadgeEstado } from '../../components/ui/BadgeEstado';
import {
  formatCentavos,
  formatEtiquetaMes,
  formatPorcentaje,
  mesActualClave
} from '../../lib/format';

function desplazarMes(claveMes: string, deltaMeses: number): string {
  const [yStr, mStr] = claveMes.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return claveMes;
  const fecha = new Date(y, m - 1 + deltaMeses, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

export function DashboardPage() {
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(mesActualClave());

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Dashboard financiero
          </h1>
          <p className="text-sm text-text-muted">
            Estado del mes, ejecución presupuestaria por categoría y evolución.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 bg-card border border-border rounded-xl p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMesSeleccionado((m) => desplazarMes(m, -1))}
            aria-label="Mes anterior"
            className="tappable flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-bg"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="min-w-[110px] text-center font-mono text-sm font-semibold text-text px-2">
            {formatEtiquetaMes(mesSeleccionado)}
          </span>
          <button
            type="button"
            onClick={() => setMesSeleccionado((m) => desplazarMes(m, 1))}
            aria-label="Mes siguiente"
            className="tappable flex h-11 w-11 items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-bg"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Tarjetas principales del mes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Reveal className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Ingresos del mes
          </span>
          <p className="font-mono text-2xl font-bold text-ok">{formatCentavos(0)}</p>
        </Reveal>

        <Reveal delay={0.03} className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Gastos del mes
          </span>
          <p className="font-mono text-2xl font-bold text-mal">{formatCentavos(0)}</p>
        </Reveal>

        <Reveal delay={0.06} className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Saldo del mes
          </span>
          <p className="font-mono text-2xl font-bold text-text">{formatCentavos(0)}</p>
        </Reveal>

        <Reveal delay={0.09} className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Estado del mes
          </span>
          <div className="pt-0.5">
            <BadgeEstado texto="SIN DATOS" nivel="neutro" />
          </div>
          <p className="text-xs text-text-muted">Aún no hay movimientos este mes</p>
        </Reveal>
      </div>

      {/* Indicadores secundarios */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Saldo acumulado (histórico)', valor: formatCentavos(0) },
          { label: `Ingresos ${mesSeleccionado.slice(0, 4)}`, valor: formatCentavos(0) },
          { label: `Gastos ${mesSeleccionado.slice(0, 4)}`, valor: formatCentavos(0) },
          { label: '% gastado del mes', valor: formatPorcentaje(0) }
        ].map((item) => (
          <div
            key={item.label}
            className="bg-card/70 border border-border rounded-xl p-3.5 space-y-1"
          >
            <span className="block text-xs text-text-muted">{item.label}</span>
            <span className="block font-mono text-base sm:text-lg font-semibold text-text">
              {item.valor}
            </span>
          </div>
        ))}
      </div>

      {/* Sección Presupuesto por categoría */}
      <Reveal className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent-gold" aria-hidden="true" />
          <h2 className="text-base font-semibold text-text">
            Presupuesto del mes por categoría
          </h2>
        </div>
        <p className="text-xs text-text-muted">
          Los presupuestos y gastos por categoría con fila TOTAL y semáforo se conectan en las fases 2 y 3.
        </p>
      </Reveal>
    </div>
  );
}
