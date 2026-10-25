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
  '#F0C38E', // arena
  '#F1AA9B', // coral
  '#9FD8B4', // menta
  '#B7A9F2', // lila
  '#E2AC6D', // arena profunda
  '#EC8192', // rosa
  '#8ECBE0', // celeste suave
  '#D9C7A5', // lino
  '#C98FB8', // malva
  '#F5DDB8'  // crema
] as const;

const COLOR_INGRESO = '#9FD8B4';
const COLOR_GASTO = '#F1AA9B';
const COLOR_GUIA = 'rgba(189, 182, 214, 0.22)';
const COLOR_ETIQUETA = '#BDB6D6';

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
    <div className="panel p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h3 className="text-base font-semibold text-text">{titulo}</h3>
          <p className="text-xs text-text-muted">{subtitulo}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-ok" aria-hidden="true" />
            Ingresos
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-coral" aria-hidden="true" />
            Gastos
          </span>
        </div>
      </div>

      {!hayDatos ? (
        <div className="panel-inset border border-dashed border-border/60 py-10 px-4 text-center">
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
                  stroke={COLOR_GUIA}
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
                    fill={COLOR_INGRESO}
                    opacity={item.ingresosCentavos > 0 ? 0.92 : 0.25}
                  />
                  {/* Barra Gastos */}
                  <rect
                    x={centerX + 2}
                    y={hGas > 0 ? yGas : baseY - 2}
                    width={barWidth}
                    height={Math.max(hGas, 2)}
                    rx={4}
                    fill={COLOR_GASTO}
                    opacity={item.gastosCentavos > 0 ? 0.92 : 0.25}
                  />
                  {/* Etiqueta eje X */}
                  <text
                    x={centerX}
                    y={188}
                    textAnchor="middle"
                    fill={COLOR_ETIQUETA}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/40">
            {datos
              .filter((d) => d.ingresosCentavos > 0 || d.gastosCentavos > 0)
              .slice(-6)
              .map((d) => (
                <div
                  key={d.clave}
                  className="panel-inset px-2.5 py-1.5 text-xs flex items-center justify-between gap-2"
                >
                  <span className="font-mono text-text-muted truncate">{d.etiqueta}</span>
                  <span className="font-mono whitespace-nowrap">
                    <span className="text-ok">+{formatCentavos(d.ingresosCentavos)}</span>
                    {' / '}
                    <span className="text-coral">-{formatCentavos(d.gastosCentavos)}</span>
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
    <div className="panel p-4 sm:p-6 space-y-4">
      <div className="border-b border-border pb-3">
        <h3 className="text-base font-semibold text-text">¿En qué gastas este mes?</h3>
        <p className="text-xs text-text-muted">
          Distribución de gastos por categoría en {etiquetaMes}
        </p>
      </div>

      {datos.length === 0 || totalGastoCentavos <= 0 ? (
        <div className="panel-inset border border-dashed border-border/60 py-10 px-4 text-center">
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
                  stroke="rgba(40,35,66,0.9)"
                  strokeWidth="24"
                />
                {datos.map((item, idx) => {
                  const longitud = item.porcentajeDelTotal * circunferencia;
                  const offset = -acumuladoPct * circunferencia;
                  acumuladoPct += item.porcentajeDelTotal;
                  const color = COLORES_DONA[idx % COLORES_DONA.length] ?? '#F0C38E';

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
                <span className="text-[11px] text-text-muted">
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
              const color = COLORES_DONA[idx % COLORES_DONA.length] ?? '#F0C38E';
              return (
                <li
                  key={item.categoria}
                  className="flex items-center justify-between gap-3 panel-inset px-3.5 py-2.5 text-sm"
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
