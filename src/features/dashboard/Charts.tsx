import type {
  GastoCategoriaGrafico,
  SerieIngresosGastos
} from '../../domain/calculations';
import { formatCentavos, formatPorcentaje } from '../../lib/format';

interface BarComparisonChartProps {
  titulo: string;
  subtitulo: string;
  datos: readonly SerieIngresosGastos[];
}

const COLORES_DONA = [
  '#E2B65C', // acento dorado
  '#00B4D8', // acento cian
  '#34D399', // ok
  '#FBBF24', // alerta
  '#FB923C', // riesgo
  '#F87171', // mal
  '#A78BFA', // violeta
  '#38BDF8', // celeste
  '#4ADE80', // verde
  '#F472B6'  // rosa
] as const;

export function BarComparisonChart({
  titulo,
  subtitulo,
  datos
}: BarComparisonChartProps) {
  const maxValor = Math.max(
    1,
    ...datos.flatMap((d) => [d.ingresosCentavos, d.gastosCentavos])
  );
  const hayDatos = datos.some((d) => d.ingresosCentavos > 0 || d.gastosCentavos > 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h3 className="text-base font-semibold text-text">{titulo}</h3>
          <p className="text-xs text-text-muted">{subtitulo}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <span className="h-2.5 w-2.5 rounded-xs bg-ok" aria-hidden="true" />
            Ingresos
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <span className="h-2.5 w-2.5 rounded-xs bg-mal" aria-hidden="true" />
            Gastos
          </span>
        </div>
      </div>

      {!hayDatos ? (
        <div className="rounded-xl border border-dashed border-border bg-bg/50 py-10 px-4 text-center">
          <p className="text-sm font-medium text-text">Sin movimientos en este período</p>
          <p className="text-xs text-text-muted mt-1">
            Las barras comparativas se mostrarán en cuanto existan ingresos o gastos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <svg
            viewBox={`0 0 ${Math.max(datos.length * 76, 320)} 210`}
            className="w-full h-52 overflow-visible"
            role="img"
            aria-label={titulo}
          >
            {/* Líneas guía horizontales */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = 165 - ratio * 140;
              return (
                <line
                  key={ratio}
                  x1={8}
                  x2={Math.max(datos.length * 76 - 8, 300)}
                  y1={y}
                  y2={y}
                  stroke="#242C42"
                  strokeDasharray={ratio === 0 ? undefined : '3 3'}
                  strokeWidth={1}
                />
              );
            })}

            {datos.map((item, idx) => {
              const groupWidth = Math.max(320 / Math.max(datos.length, 1), 76);
              const centerX = idx * groupWidth + groupWidth / 2;
              const barWidth = 18;
              const maxBarHeight = 140;
              const baseY = 165;

              const hIng = Math.round((item.ingresosCentavos / maxValor) * maxBarHeight);
              const hGas = Math.round((item.gastosCentavos / maxValor) * maxBarHeight);

              const yIng = baseY - hIng;
              const yGas = baseY - hGas;

              return (
                <g key={item.clave}>
                  <title>
                    {`${item.etiqueta} — Ingresos: ${formatCentavos(item.ingresosCentavos)} | Gastos: ${formatCentavos(item.gastosCentavos)}`}
                  </title>
                  {/* Barra Ingresos */}
                  <rect
                    x={centerX - barWidth - 2}
                    y={hIng > 0 ? yIng : baseY - 2}
                    width={barWidth}
                    height={Math.max(hIng, 2)}
                    rx={4}
                    fill="#34D399"
                    opacity={item.ingresosCentavos > 0 ? 0.92 : 0.25}
                  />
                  {/* Barra Gastos */}
                  <rect
                    x={centerX + 2}
                    y={hGas > 0 ? yGas : baseY - 2}
                    width={barWidth}
                    height={Math.max(hGas, 2)}
                    rx={4}
                    fill="#F87171"
                    opacity={item.gastosCentavos > 0 ? 0.92 : 0.25}
                  />
                  {/* Etiqueta eje X */}
                  <text
                    x={centerX}
                    y={188}
                    textAnchor="middle"
                    fill="#8A99AD"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                  >
                    {item.etiqueta}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Resumen accesible en lista compacta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/60">
            {datos
              .filter((d) => d.ingresosCentavos > 0 || d.gastosCentavos > 0)
              .slice(-6)
              .map((d) => (
                <div
                  key={d.clave}
                  className="rounded-lg bg-bg border border-border/70 px-2.5 py-1.5 text-xs flex items-center justify-between gap-2"
                >
                  <span className="font-mono text-text-muted truncate">{d.etiqueta}</span>
                  <span className="font-mono whitespace-nowrap">
                    <span className="text-ok">+{formatCentavos(d.ingresosCentavos)}</span>
                    {' / '}
                    <span className="text-mal">-{formatCentavos(d.gastosCentavos)}</span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CategoryDonutChartProps {
  datos: readonly GastoCategoriaGrafico[];
  totalGastoCentavos: number;
  etiquetaMes: string;
}

export function CategoryDonutChart({
  datos,
  totalGastoCentavos,
  etiquetaMes
}: CategoryDonutChartProps) {
  const radio = 64;
  const circunferencia = 2 * Math.PI * radio;
  let acumuladoPct = 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-semibold text-text">¿En qué gastas este mes?</h3>
        <p className="text-xs text-text-muted">
          Distribución de gastos por categoría en {etiquetaMes}
        </p>
      </div>

      {datos.length === 0 || totalGastoCentavos <= 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-bg/50 py-10 px-4 text-center">
          <p className="text-sm font-medium text-text">Sin gastos registrados en {etiquetaMes}</p>
          <p className="text-xs text-text-muted mt-1">
            Registra un gasto para visualizar qué porcentaje se lleva cada categoría.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 flex justify-center">
            <div className="relative h-48 w-48 flex items-center justify-center">
              <svg
                viewBox="0 0 180 180"
                className="h-48 w-48 -rotate-90"
                role="img"
                aria-label={`Distribución de gastos en ${etiquetaMes}`}
              >
                <circle
                  cx="90"
                  cy="90"
                  r={radio}
                  fill="transparent"
                  stroke="#242C42"
                  strokeWidth="24"
                />
                {datos.map((item, idx) => {
                  const longitud = item.porcentajeDelTotal * circunferencia;
                  const offset = -acumuladoPct * circunferencia;
                  acumuladoPct += item.porcentajeDelTotal;
                  const color = COLORES_DONA[idx % COLORES_DONA.length] ?? '#E2B65C';

                  return (
                    <circle
                      key={item.categoria}
                      cx="90"
                      cy="90"
                      r={radio}
                      fill="transparent"
                      stroke={color}
                      strokeWidth="24"
                      strokeDasharray={`${longitud} ${circunferencia}`}
                      strokeDashoffset={offset}
                    >
                      <title>
                        {`${item.categoria}: ${formatCentavos(item.gastadoCentavos)} (${formatPorcentaje(item.porcentajeDelTotal)})`}
                      </title>
                    </circle>
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                <span className="text-[11px] uppercase tracking-wider text-text-muted">
                  Total gasto
                </span>
                <span className="font-mono text-sm font-bold text-text">
                  {formatCentavos(totalGastoCentavos)}
                </span>
              </div>
            </div>
          </div>

          <ul className="md:col-span-7 space-y-2">
            {datos.map((item, idx) => {
              const color = COLORES_DONA[idx % COLORES_DONA.length] ?? '#E2B65C';
              return (
                <li
                  key={item.categoria}
                  className="flex items-center justify-between gap-3 rounded-xl bg-bg border border-border px-3.5 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="font-medium text-text truncate">{item.categoria}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono text-xs sm:text-sm">
                    <span className="text-text-muted">
                      {formatPorcentaje(item.porcentajeDelTotal)}
                    </span>
                    <span className="font-bold text-text">
                      {formatCentavos(item.gastadoCentavos)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
