import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, PlusCircle, RotateCcw, Save } from 'lucide-react';
import { LiveNotice, type AvisoEstado } from '../../components/ui/LiveNotice';
import { guardarMovimiento } from '../../db/repositories';
import type { CategoriaRecord, MovimientoRecord } from '../../db/types';
import { METODOS_PAGO, type TipoMovimiento } from '../../domain/types';
import { cn } from '../../lib/cn';
import { formatCentavos, hoyIso } from '../../lib/format';
import { centavosAInputDecimal, parseMontoACentavos } from '../../lib/money';

interface MovimientoFormProps {
  categorias: readonly CategoriaRecord[];
  movimientoEditar?: MovimientoRecord | null;
  onGuardado?: (record: MovimientoRecord, eraEdicion: boolean) => void;
  onCancelarEdicion?: () => void;
}

export function MovimientoForm({
  categorias,
  movimientoEditar = null,
  onGuardado,
  onCancelarEdicion
}: MovimientoFormProps) {
  const [tipo, setTipo] = useState<TipoMovimiento>('Gasto');
  const [fecha, setFecha] = useState<string>(hoyIso());
  const [categoria, setCategoria] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [metodo, setMetodo] = useState<string>('Efectivo');
  const [observacion, setObservacion] = useState<string>('');
  const [aviso, setAviso] = useState<AvisoEstado | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);

  const categoriasDelTipo = categorias.filter((c) => c.tipo === tipo);

  useEffect(() => {
    if (movimientoEditar) {
      setTipo(movimientoEditar.tipo);
      setFecha(movimientoEditar.fecha);
      setCategoria(movimientoEditar.categoria);
      setMonto(centavosAInputDecimal(movimientoEditar.montoCentavos));
      setDescripcion(movimientoEditar.descripcion);
      setMetodo(movimientoEditar.metodo || 'Efectivo');
      setObservacion(movimientoEditar.observacion);
      setAviso(null);
    }
  }, [movimientoEditar]);

  useEffect(() => {
    if (categoriasDelTipo.length === 0) return;
    const existeEnTipo = categoriasDelTipo.some((c) => c.nombre === categoria);
    if (!existeEnTipo) {
      setCategoria(categoriasDelTipo[0]?.nombre ?? '');
    }
  }, [tipo, categoriasDelTipo, categoria]);

  const cambiarTipo = (nuevoTipo: TipoMovimiento) => {
    setTipo(nuevoTipo);
    const primera = categorias.find((c) => c.tipo === nuevoTipo);
    setCategoria(primera?.nombre ?? '');
  };

  const limpiarFormulario = () => {
    setFecha(hoyIso());
    setTipo('Gasto');
    const primeraGasto = categorias.find((c) => c.tipo === 'Gasto');
    setCategoria(primeraGasto?.nombre ?? '');
    setMonto('');
    setDescripcion('');
    setMetodo('Efectivo');
    setObservacion('');
    setAviso(null);
    onCancelarEdicion?.();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAviso(null);

    const montoCentavos = parseMontoACentavos(monto);
    if (montoCentavos === null || montoCentavos <= 0) {
      setAviso({
        tipo: 'error',
        mensaje: 'Ingresa un monto válido mayor a $0,00 (ej. 12,50)'
      });
      return;
    }

    setGuardando(true);
    try {
      const resultado = await guardarMovimiento(
        {
          fecha,
          tipo,
          categoria,
          descripcion,
          montoCentavos,
          metodo,
          observacion
        },
        movimientoEditar?.id
      );

      if (!resultado.ok) {
        setAviso({ tipo: 'error', mensaje: resultado.error });
        return;
      }

      const eraEdicion = Boolean(movimientoEditar);
      const resumenMonto = formatCentavos(resultado.record.montoCentavos);

      if (!eraEdicion) {
        setMonto('');
        setDescripcion('');
        setObservacion('');
      }

      setAviso({
        tipo: 'exito',
        mensaje: `${eraEdicion ? 'Movimiento actualizado' : 'Movimiento registrado'}: ${resultado.record.categoria} (${resumenMonto})`
      });

      onGuardado?.(resultado.record, eraEdicion);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
      <LiveNotice aviso={aviso} onDismiss={() => setAviso(null)} />

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
            htmlFor="form-monto"
            className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
          >
            Monto (USD)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-text-muted">
              $
            </span>
            <input
              id="form-monto"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              required
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-bg border border-border pl-8 pr-3.5 py-2.5 font-mono text-base text-text placeholder:text-text-muted/50 focus:border-accent-cyan"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="form-fecha"
            className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
          >
            Fecha
          </label>
          <input
            id="form-fecha"
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2.5 font-mono text-base text-text focus:border-accent-cyan"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="form-categoria"
            className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
          >
            Categoría ({tipo})
          </label>
          <select
            id="form-categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2.5 text-base text-text focus:border-accent-cyan"
          >
            {categoriasDelTipo.map((cat) => (
              <option key={cat.nombre} value={cat.nombre}>
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="form-metodo"
            className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
          >
            Método de pago
          </label>
          <select
            id="form-metodo"
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
          htmlFor="form-descripcion"
          className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
        >
          Descripción
        </label>
        <input
          id="form-descripcion"
          type="text"
          placeholder="Ej. Almuerzo, pasaje, pago de beca..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2.5 text-base text-text placeholder:text-text-muted/50 focus:border-accent-cyan"
        />
      </div>

      <div>
        <label
          htmlFor="form-observacion"
          className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
        >
          Observación (opcional)
        </label>
        <input
          id="form-observacion"
          type="text"
          placeholder="Nota adicional o comprobante"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2.5 text-base text-text placeholder:text-text-muted/50 focus:border-accent-cyan"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={guardando}
          className="tappable tappable-hover flex-1 min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-accent-gold px-5 py-2.5 text-sm font-bold text-bg shadow-sm disabled:opacity-50"
        >
          {movimientoEditar ? (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Actualizar movimiento</span>
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>Guardar movimiento</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={limpiarFormulario}
          className="tappable min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-bg border border-border px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>{movimientoEditar ? 'Cancelar edición' : 'Limpiar'}</span>
        </button>
      </div>
    </form>
  );
}
