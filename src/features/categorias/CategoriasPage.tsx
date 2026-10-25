import { Tags } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { formatCentavos } from '../../lib/format';

const CATEGORIAS_INICIALES = [
  { nombre: 'Sueldo', tipo: 'Ingreso', presupuestoCentavos: 0 },
  { nombre: 'Ventas', tipo: 'Ingreso', presupuestoCentavos: 0 },
  { nombre: 'Otros ingresos', tipo: 'Ingreso', presupuestoCentavos: 0 },
  { nombre: 'Vivienda', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Alimentación', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Transporte', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Servicios', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Telefonía', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Salud', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Educación', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Cuidado Personal', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Antojos', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Entretenimiento', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Ahorro Laptop', tipo: 'Gasto', presupuestoCentavos: 0 },
  { nombre: 'Otros gastos', tipo: 'Gasto', presupuestoCentavos: 0 }
] as const;

export function CategoriasPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Categorías y presupuesto
          </h1>
          <p className="text-sm text-text-muted">
            Define tu presupuesto mensual por categoría. Renombrar actualiza sus movimientos automáticamente.
          </p>
        </div>
      </header>

      <Reveal className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-accent-gold" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text">
              Categorías base ({CATEGORIAS_INICIALES.length})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIAS_INICIALES.map((cat) => (
            <div
              key={cat.nombre}
              className="flex items-center justify-between rounded-xl bg-bg border border-border p-3.5"
            >
              <div>
                <p className="text-sm font-semibold text-text">{cat.nombre}</p>
                <span className="text-xs text-text-muted">{cat.tipo}</span>
              </div>
              <span className="font-mono text-sm font-medium text-text-muted">
                {formatCentavos(cat.presupuestoCentavos)}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  );
}
