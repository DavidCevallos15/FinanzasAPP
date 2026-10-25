import { useMemo, useState } from 'react';
import {
  Lock,
  Pencil,
  Plus,
  Tags,
  Trash2
} from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { LiveNotice, type AvisoEstado } from '../../components/ui/LiveNotice';
import { Modal } from '../../components/ui/Modal';
import { useCategorias, useMovimientos } from '../../db/hooks';
import {
  actualizarPresupuestoCategoria,
  crearCategoria,
  eliminarCategoria,
  renombrarCategoria
} from '../../db/repositories';
import type { CategoriaRecord } from '../../db/types';
import { CATEGORIA_RESPALDO, type TipoMovimiento } from '../../domain/types';
import { cn } from '../../lib/cn';
import { formatCentavos } from '../../lib/format';
import { centavosAInputDecimal, parseMontoACentavos } from '../../lib/money';

export function CategoriasPage() {
  const categorias = useCategorias();
  const movimientos = useMovimientos();

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<TipoMovimiento>('Gasto');
  const [nuevoPresupuesto, setNuevoPresupuesto] = useState('0,00');
  const [aviso, setAviso] = useState<AvisoEstado | null>(null);

  // Estado modal Editar (renombrar + presupuesto)
  const [catEditando, setCatEditando] = useState<CategoriaRecord | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [presupuestoEditado, setPresupuestoEditado] = useState('');
  const [errorModalEditar, setErrorModalEditar] = useState<string | null>(null);

  // Estado modal Eliminar (con selector de categoría destino si tiene movimientos)
  const [catEliminar, setCatEliminar] = useState<CategoriaRecord | null>(null);
  const [destinoReasignacion, setDestinoReasignacion] = useState<string>('');
  const [errorModalEliminar, setErrorModalEliminar] = useState<string | null>(null);

  const conteoPorCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const m of movimientos) {
      mapa.set(m.categoria, (mapa.get(m.categoria) ?? 0) + 1);
    }
    return mapa;
  }, [movimientos]);

  const categoriasGasto = useMemo(
    () => categorias.filter((c) => c.tipo === 'Gasto'),
    [categorias]
  );
  const categoriasIngreso = useMemo(
    () => categorias.filter((c) => c.tipo === 'Ingreso'),
    [categorias]
  );

  const totalPresupuestoGasto = useMemo(
    () => categoriasGasto.reduce((acc, c) => acc + c.presupuestoCentavos, 0),
    [categoriasGasto]
  );

  const handleCrearCategoria = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAviso(null);

    const centavos =
      nuevoTipo === 'Ingreso'
        ? 0
        : (parseMontoACentavos(nuevoPresupuesto || '0') ?? -1);

    if (centavos < 0) {
      setAviso({
        tipo: 'error',
        mensaje: 'Ingresa un presupuesto mensual válido mayor o igual a $0,00'
      });
      return;
    }

    const res = await crearCategoria({
      nombre: nuevoNombre,
      tipo: nuevoTipo,
      presupuestoCentavos: centavos
    });

    if (!res.ok) {
      setAviso({ tipo: 'error', mensaje: res.error });
      return;
    }

    setNuevoNombre('');
    setNuevoPresupuesto('0,00');
    setAviso({
      tipo: 'exito',
      mensaje: `Categoría "${nuevoNombre.trim()}" creada correctamente`
    });
  };

  const abrirModalEditar = (cat: CategoriaRecord) => {
    setCatEditando(cat);
    setNombreEditado(cat.nombre);
    setPresupuestoEditado(centavosAInputDecimal(cat.presupuestoCentavos));
    setErrorModalEditar(null);
  };

  const guardarEdicionCategoria = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!catEditando) return;
    setErrorModalEditar(null);

    const presupuestoCentavos =
      catEditando.tipo === 'Ingreso'
        ? 0
        : (parseMontoACentavos(presupuestoEditado || '0') ?? -1);

    if (presupuestoCentavos < 0) {
      setErrorModalEditar('Ingresa un presupuesto válido mayor o igual a $0,00');
      return;
    }

    const nombreLimpio = nombreEditado.trim();
    let movimientosActualizados = 0;

    if (nombreLimpio !== catEditando.nombre) {
      const resRen = await renombrarCategoria(catEditando.nombre, nombreLimpio);
      if (!resRen.ok) {
        setErrorModalEditar(resRen.error);
        return;
      }
      movimientosActualizados = resRen.movimientosActualizados;
    }

    const resPres = await actualizarPresupuestoCategoria(nombreLimpio, presupuestoCentavos);
    if (!resPres.ok) {
      setErrorModalEditar(resPres.error);
      return;
    }

    setCatEditando(null);
    setAviso({
      tipo: 'exito',
      mensaje:
        movimientosActualizados > 0
          ? `Categoría actualizada a "${nombreLimpio}" (${movimientosActualizados} movimiento(s) propagados)`
          : `Categoría "${nombreLimpio}" actualizada`
    });
  };

  const abrirModalEliminar = (cat: CategoriaRecord) => {
    const candidatas = categorias.filter(
      (c) => c.tipo === cat.tipo && c.nombre !== cat.nombre
    );
    const porDefecto =
      candidatas.find((c) => c.nombre === CATEGORIA_RESPALDO[cat.tipo])?.nombre ??
      candidatas[0]?.nombre ??
      '';
    setCatEliminar(cat);
    setDestinoReasignacion(porDefecto);
    setErrorModalEliminar(null);
  };

  const confirmarEliminarCategoria = async () => {
    if (!catEliminar) return;
    setErrorModalEliminar(null);

    const res = await eliminarCategoria(catEliminar.nombre, destinoReasignacion);
    if (!res.ok) {
      setErrorModalEliminar(res.error);
      return;
    }

    const nombreBorrado = catEliminar.nombre;
    setCatEliminar(null);
    setAviso({
      tipo: 'exito',
      mensaje:
        res.reasignados > 0
          ? `Categoría "${nombreBorrado}" eliminada (${res.reasignados} movimiento(s) reasignados a "${destinoReasignacion}")`
          : `Categoría "${nombreBorrado}" eliminada`
    });
  };

  const renderListaCategorias = (
    titulo: string,
    subtitulo: string,
    lista: readonly CategoriaRecord[],
    mostrarPresupuesto: boolean
  ) => (
    <Reveal className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Tags className="h-5 w-5 text-accent-gold" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-text">
              {titulo} ({lista.length})
            </h2>
            <p className="text-xs text-text-muted">{subtitulo}</p>
          </div>
        </div>
        {mostrarPresupuesto && (
          <span className="font-mono text-xs sm:text-sm font-semibold text-accent-gold bg-accent-gold/10 border border-accent-gold/30 rounded-xl px-3 py-1.5">
            Presupuesto mensual total: {formatCentavos(totalPresupuestoGasto)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {lista.map((cat) => {
          const uso = conteoPorCategoria.get(cat.nombre) ?? 0;
          const esProtegida =
            cat.nombre === CATEGORIA_RESPALDO.Ingreso ||
            cat.nombre === CATEGORIA_RESPALDO.Gasto;

          return (
            <div
              key={cat.nombre}
              className="flex items-center justify-between gap-3 rounded-xl bg-bg border border-border p-3.5"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-text truncate">{cat.nombre}</p>
                  {esProtegida && (
                    <span
                      title="Categoría de respaldo del sistema"
                      className="inline-flex items-center gap-1 rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-medium text-text-muted"
                    >
                      <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                      Base
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  {uso} movimiento{uso === 1 ? '' : 's'}
                  {mostrarPresupuesto && (
                    <>
                      {' · '}
                      <span className="font-mono text-text">
                        Presupuesto: {formatCentavos(cat.presupuestoCentavos)}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => abrirModalEditar(cat)}
                  aria-label={`Editar ${cat.nombre}`}
                  className="tappable min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-card border border-border text-text-muted hover:text-text"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                {!esProtegida && (
                  <button
                    type="button"
                    onClick={() => abrirModalEliminar(cat)}
                    aria-label={`Eliminar ${cat.nombre}`}
                    className="tappable min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-mal/10 border border-mal/30 text-mal hover:bg-mal/20"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Reveal>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
          Categorías y presupuesto
        </h1>
        <p className="text-sm text-text-muted">
          Asigna tu presupuesto mensual por categoría. Si renombras una categoría, todos sus
          movimientos se actualizan solos.
        </p>
      </header>

      <LiveNotice aviso={aviso} onDismiss={() => setAviso(null)} />

      {/* Formulario para crear nueva categoría */}
      <Reveal className="bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-text">Nueva categoría</h2>
        <form
          onSubmit={(e) => void handleCrearCategoria(e)}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          noValidate
        >
          <div className="sm:col-span-5">
            <label
              htmlFor="nueva-cat-nombre"
              className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
            >
              Nombre
            </label>
            <input
              id="nueva-cat-nombre"
              type="text"
              required
              placeholder="Ej. Mascotas, Gimnasio, Beca..."
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2 text-base text-text placeholder:text-text-muted/50 focus:border-accent-cyan"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="nueva-cat-tipo"
              className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
            >
              Tipo
            </label>
            <select
              id="nueva-cat-tipo"
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value as TipoMovimiento)}
              className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2 text-base text-text focus:border-accent-cyan"
            >
              <option value="Gasto">Gasto</option>
              <option value="Ingreso">Ingreso</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="nueva-cat-presupuesto"
              className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
            >
              Presupuesto ($)
            </label>
            <input
              id="nueva-cat-presupuesto"
              type="text"
              inputMode="decimal"
              disabled={nuevoTipo === 'Ingreso'}
              value={nuevoTipo === 'Ingreso' ? '0,00' : nuevoPresupuesto}
              onChange={(e) => setNuevoPresupuesto(e.target.value)}
              className={cn(
                'w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2 font-mono text-base text-text focus:border-accent-cyan',
                nuevoTipo === 'Ingreso' && 'opacity-50 cursor-not-allowed'
              )}
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="tappable tappable-hover w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent-gold px-4 py-2 text-sm font-bold text-bg"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>Crear</span>
            </button>
          </div>
        </form>
      </Reveal>

      {renderListaCategorias(
        'Categorías de Gasto',
        'El presupuesto mensual define el semáforo de tu Dashboard.',
        categoriasGasto,
        true
      )}

      {renderListaCategorias(
        'Categorías de Ingreso',
        'Para clasificar sueldos, becas, bonos o ventas.',
        categoriasIngreso,
        false
      )}

      {/* Modal Editar Categoría */}
      <Modal
        open={Boolean(catEditando)}
        onClose={() => setCatEditando(null)}
        title={`Editar categoría: ${catEditando?.nombre ?? ''}`}
        description="Si cambias el nombre, todos los movimientos asociados se actualizarán automáticamente."
      >
        {catEditando && (
          <form onSubmit={(e) => void guardarEdicionCategoria(e)} className="space-y-4">
            {errorModalEditar && (
              <div
                role="alert"
                className="rounded-xl bg-mal/15 border border-mal/35 px-3.5 py-2.5 text-xs font-medium text-mal"
              >
                {errorModalEditar}
              </div>
            )}

            <div>
              <label
                htmlFor="editar-cat-nombre"
                className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
              >
                Nombre de la categoría
              </label>
              <input
                id="editar-cat-nombre"
                type="text"
                disabled={
                  catEditando.nombre === CATEGORIA_RESPALDO.Ingreso ||
                  catEditando.nombre === CATEGORIA_RESPALDO.Gasto
                }
                value={nombreEditado}
                onChange={(e) => setNombreEditado(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2 text-base text-text disabled:opacity-50"
              />
            </div>

            {catEditando.tipo === 'Gasto' && (
              <div>
                <label
                  htmlFor="editar-cat-presupuesto"
                  className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                >
                  Presupuesto mensual (USD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-text-muted">
                    $
                  </span>
                  <input
                    id="editar-cat-presupuesto"
                    type="text"
                    inputMode="decimal"
                    value={presupuestoEditado}
                    onChange={(e) => setPresupuestoEditado(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-bg border border-border pl-8 pr-3.5 py-2 font-mono text-base text-text"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCatEditando(null)}
                className="tappable min-h-[44px] rounded-xl bg-bg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="tappable min-h-[44px] rounded-xl bg-accent-gold px-4 py-2 text-sm font-bold text-bg"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Eliminar Categoría con Selector de Reasignación */}
      <Modal
        open={Boolean(catEliminar)}
        onClose={() => setCatEliminar(null)}
        title={`Eliminar categoría "${catEliminar?.nombre ?? ''}"`}
        description="Confirma la eliminación de esta categoría."
      >
        {catEliminar && (
          <div className="space-y-4">
            {errorModalEliminar && (
              <div
                role="alert"
                className="rounded-xl bg-mal/15 border border-mal/35 px-3.5 py-2.5 text-xs font-medium text-mal"
              >
                {errorModalEliminar}
              </div>
            )}

            {(conteoPorCategoria.get(catEliminar.nombre) ?? 0) > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-text">
                  La categoría <strong>{catEliminar.nombre}</strong> tiene{' '}
                  <strong className="font-mono text-alerta">
                    {conteoPorCategoria.get(catEliminar.nombre)}
                  </strong>{' '}
                  movimiento(s) registrado(s). Elige a qué categoría de{' '}
                  <strong>{catEliminar.tipo}</strong> quieres reasignarlos antes de borrarla:
                </p>

                <div>
                  <label
                    htmlFor="select-destino-reasignar"
                    className="block text-xs font-medium uppercase tracking-wider text-text-muted mb-1.5"
                  >
                    Reasignar movimientos a
                  </label>
                  <select
                    id="select-destino-reasignar"
                    value={destinoReasignacion}
                    onChange={(e) => setDestinoReasignacion(e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-bg border border-border px-3.5 py-2 text-base text-text"
                  >
                    {categorias
                      .filter((c) => c.tipo === catEliminar.tipo && c.nombre !== catEliminar.nombre)
                      .map((c) => (
                        <option key={c.nombre} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                Esta categoría no tiene movimientos asociados. ¿Deseas eliminarla?
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCatEliminar(null)}
                className="tappable min-h-[44px] rounded-xl bg-bg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarEliminarCategoria()}
                className="tappable min-h-[44px] rounded-xl bg-mal px-4 py-2 text-sm font-bold text-bg"
              >
                {(conteoPorCategoria.get(catEliminar.nombre) ?? 0) > 0
                  ? 'Reasignar y eliminar'
                  : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
