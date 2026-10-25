import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Clock, PlusCircle, RotateCcw } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { METODOS_PAGO, type TipoMovimiento } from '../../domain/types';
import { cn } from '../../lib/cn';
import { formatCentavos, formatFechaCorta, hoyIso } from '../../lib/format';

const CATEGORIAS_VISTA_PREVIA: Record<TipoMovimiento, readonly string[]> = {
  Gasto: [
    'Vivienda',
    'Alimentación',
    'Transporte',
    'Servicios',
    'Telefonía',
    'Salud',
    'Educación',
    'Cuidado Personal',
    'Antojos',
    'Entretenimiento',
    'Ahorro Laptop',
    'Otros gastos'
  ],
  Ingreso: ['Sueldo', 'Ventas', 'Otros ingresos']
};

export function InicioPage() {
  const [tipo, setTipo] = useState<TipoMovimiento>('Gasto');
  const [fecha, setFecha] = useState<string>(hoyIso());
  const [categoria, setCategoria] = useState<string>('Alimentación');
  const [monto, setMonto] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [metodo, setMetodo] = useState<string>('Efectivo');
  const [observacion, setObservacion] = useState<string>('');

  const categoriasDisponibles = CATEGORIAS_VISTA_PREVIA[tipo];

  const cambiarTipo = (nuevoTipo: TipoMovimiento) => {
    setTipo(nuevoTipo);
    setCategoria(CATEGORIAS_VISTA_PREVIA[nuevoTipo][0] ?? '');
  };

  const limpiar = () => {
    setFecha(hoyIso());
    setTipo('Gasto');
    setCategoria('Alimentación');
    setMonto('');
    setDescripcion('');
    setMetodo('Efectivo');
    setObservacion('');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Registrar movimiento
          </h1>
          <p className="text-sm text-text-muted">
            Registra tus ingresos y gastos al instante. Todo queda guardado en este dispositivo.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Reveal className="lg:col-span-7 bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-accent-gold" aria-hidden="true" />
              <h2 className="text-base font-semibold text-text">Nuevo movimiento</h2>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {formatFechaCorta(fecha)}
            </span>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-4"
            noValidate
          >
            {/* Tipo segmentado */}
            <fieldset>
              <legend className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-2">
                Tipo de movimiento
              </legend>
              <div className="grid grid-cols-2 gap-2 p-1 bg-bg rounded-xl border border-border">
                {(['Gasto', 'Ingreso'] as const).map((opcion) => {
                  const activo = tipo === opcion;
                  return (
                    <button
                      key={opcion}
                      type="button"
                      onClick={() => cambiarTipo(opcion)}
                      aria-pressed={activo}
                      className={cn(
                        'tappable flex items-center justify-center gap-2 min-h-[44px] rounded-lg text-sm font-semibold transition-colors',
                        activo
                          ? opcion === 'Ingreso'
                            ? 'bg-ok/20 text-ok border border-ok/40'
                            : 'bg-mal/20 text-mal border border-mal/40'
                          : 'text-text-muted hover:text-text border border-transparent'
                      )}
                    >
                      {opcion === 'Ingreso' ? (
                        <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>{opcion}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="campo-monto"
                  className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                >
                  Monto (USD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-text-muted">
                    $
                  </span>
                  <input
                    id="campo-monto"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-bg border border-border pl-8 pr-3.5 py-2.5 font-mono text-base text-text placeholder:text-text-muted/50 focus:border-accent-cyan"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="campo-fecha"
                  className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                >
                  Fecha
                </label>
                <input
                  id="campo-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2.5 font-mono text-base text-text focus:border-accent-cyan"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="campo-categoria"
                  className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                >
                  Categoría ({tipo})
                </label>
                <select
                  id="campo-categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2.5 text-base text-text focus:border-accent-cyan"
                >
                  {categoriasDisponibles.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="campo-metodo"
                  className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                >
                  Método de pago
                </label>
                <select
                  id="campo-metodo"
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2.5 text-base text-text focus:border-accent-cyan"
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="campo-descripcion"
                className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
              >
                Descripción
              </label>
              <input
                id="campo-descripcion"
                type="text"
                placeholder="Ej. Almuerzo, pasaje de bus, pago de beca..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2.5 text-base text-text placeholder:text-text-muted/50 focus:border-accent-cyan"
              />
            </div>

            <div>
              <label
                htmlFor="campo-observacion"
                className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
              >
                Observación (opcional)
              </label>
              <input
                id="campo-observacion"
                type="text"
                placeholder="Nota adicional o referencia"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2.5 text-base text-text placeholder:text-text-muted/50 focus:border-accent-cyan"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="tappable tappable-hover flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-accent-gold px-5 py-2.5 text-sm font-bold text-bg shadow-sm"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span>Guardar movimiento</span>
              </button>

              <button
                type="button"
                onClick={limpiar}
                className="tappable min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-bg border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Limpiar</span>
              </button>
            </div>
          </form>
        </Reveal>

        <Reveal delay={0.05} className="lg:col-span-5 bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent-cyan" aria-hidden="true" />
              <h2 className="text-base font-semibold text-text">Últimos 5 movimientos</h2>
            </div>
            <span className="text-xs font-mono text-text-muted">
              Total hoy: {formatCentavos(0)}
            </span>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-bg/50 p-6 text-center space-y-2">
            <p className="text-sm font-medium text-text">Aún no hay movimientos registrados</p>
            <p className="text-xs text-text-muted">
              Tus últimos 5 registros aparecerán aquí con acceso rápido para editar o eliminar.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
