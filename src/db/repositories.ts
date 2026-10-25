import { CATEGORIA_RESPALDO } from '../domain/types';
import {
  categoriaInputSchema,
  validarMovimientoConCategorias,
  type CategoriaInput,
  type MovimientoInput
} from '../domain/schemas';
import { normalizarTexto } from '../lib/money';
import { db } from './database';
import { CATEGORIAS_INICIALES_SEED } from './seed';
import type { MovimientoRecord } from './types';

export async function guardarMovimiento(
  input: MovimientoInput,
  idExistente?: string
): Promise<{ ok: true; record: MovimientoRecord } | { ok: false; error: string }> {
  const categorias = await db.categorias.toArray();
  const validacion = validarMovimientoConCategorias(input, categorias);
  if (!validacion.ok) {
    return validacion;
  }

  const ahoraIso = new Date().toISOString();
  const id = idExistente && idExistente.trim() ? idExistente.trim() : crypto.randomUUID();

  if (idExistente) {
    const previo = await db.movimientos.get(id);
    if (!previo) {
      return { ok: false, error: `El movimiento con ID ${id} no existe` };
    }
  }

  const record: MovimientoRecord = {
    id,
    fecha: validacion.data.fecha,
    tipo: validacion.data.tipo,
    categoria: validacion.data.categoria,
    descripcion: validacion.data.descripcion,
    montoCentavos: validacion.data.montoCentavos,
    metodo: validacion.data.metodo,
    observacion: validacion.data.observacion,
    actualizadoEn: ahoraIso
  };

  await db.movimientos.put(record);
  return { ok: true, record };
}

export async function eliminarMovimiento(id: string): Promise<void> {
  await db.movimientos.delete(id);
}

export async function crearCategoria(
  input: CategoriaInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = categoriaInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Datos de categoría inválidos'
    };
  }

  const nombreLimpio = parsed.data.nombre.trim();
  const claveNorm = normalizarTexto(nombreLimpio);

  return db.transaction('rw', db.categorias, async () => {
    const todas = await db.categorias.toArray();
    const duplicada = todas.some((c) => normalizarTexto(c.nombre) === claveNorm);
    if (duplicada) {
      return { ok: false as const, error: `Ya existe la categoría "${nombreLimpio}"` };
    }

    await db.categorias.put({
      nombre: nombreLimpio,
      tipo: parsed.data.tipo,
      presupuestoCentavos: parsed.data.presupuestoCentavos
    });

    return { ok: true as const };
  });
}

export async function actualizarPresupuestoCategoria(
  nombre: string,
  presupuestoCentavos: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isInteger(presupuestoCentavos) || presupuestoCentavos < 0) {
    return { ok: false, error: 'El presupuesto debe ser un monto mayor o igual a $0,00' };
  }

  const existente = await db.categorias.get(nombre);
  if (!existente) {
    return { ok: false, error: `La categoría "${nombre}" no existe` };
  }

  await db.categorias.update(nombre, { presupuestoCentavos });
  return { ok: true };
}

export async function renombrarCategoria(
  nombreViejo: string,
  nombreNuevoRaw: string
): Promise<{ ok: true; movimientosActualizados: number } | { ok: false; error: string }> {
  const nombreNuevo = nombreNuevoRaw.trim();
  if (!nombreNuevo) {
    return { ok: false, error: 'El nuevo nombre de la categoría no puede estar vacío' };
  }
  if (nombreNuevo.length > 60) {
    return { ok: false, error: 'El nombre no puede superar 60 caracteres' };
  }

  const esProtegida =
    nombreViejo === CATEGORIA_RESPALDO.Ingreso || nombreViejo === CATEGORIA_RESPALDO.Gasto;
  if (esProtegida && nombreViejo !== nombreNuevo) {
    return {
      ok: false,
      error: `"${nombreViejo}" es una categoría de respaldo del sistema y no se puede renombrar`
    };
  }

  return db.transaction('rw', db.categorias, db.movimientos, async () => {
    const actual = await db.categorias.get(nombreViejo);
    if (!actual) {
      return { ok: false as const, error: `La categoría "${nombreViejo}" no existe` };
    }

    if (nombreViejo === nombreNuevo) {
      return { ok: true as const, movimientosActualizados: 0 };
    }

    const todas = await db.categorias.toArray();
    const normNuevo = normalizarTexto(nombreNuevo);
    const colision = todas.some(
      (c) => c.nombre !== nombreViejo && normalizarTexto(c.nombre) === normNuevo
    );
    if (colision) {
      return { ok: false as const, error: `Ya existe otra categoría llamada "${nombreNuevo}"` };
    }

    await db.categorias.delete(nombreViejo);
    await db.categorias.put({
      nombre: nombreNuevo,
      tipo: actual.tipo,
      presupuestoCentavos: actual.presupuestoCentavos
    });

    const ahoraIso = new Date().toISOString();
    const movimientosActualizados = await db.movimientos
      .where('categoria')
      .equals(nombreViejo)
      .modify({
        categoria: nombreNuevo,
        actualizadoEn: ahoraIso
      });

    return { ok: true as const, movimientosActualizados };
  });
}

export async function eliminarCategoria(
  nombre: string,
  categoriaDestino?: string
): Promise<{ ok: true; reasignados: number } | { ok: false; error: string }> {
  if (nombre === CATEGORIA_RESPALDO.Ingreso || nombre === CATEGORIA_RESPALDO.Gasto) {
    return {
      ok: false,
      error: `"${nombre}" es la categoría de respaldo y no se puede eliminar`
    };
  }

  return db.transaction('rw', db.categorias, db.movimientos, async () => {
    const cat = await db.categorias.get(nombre);
    if (!cat) {
      return { ok: false as const, error: `La categoría "${nombre}" no existe` };
    }

    const usoCount = await db.movimientos.where('categoria').equals(nombre).count();

    if (usoCount > 0) {
      const destinoNombre = categoriaDestino?.trim();
      if (!destinoNombre) {
        return {
          ok: false as const,
          error: `Selecciona una categoría de tipo ${cat.tipo} para reasignar los ${usoCount} movimiento(s)`
        };
      }
      if (destinoNombre === nombre) {
        return {
          ok: false as const,
          error: 'La categoría de destino debe ser distinta a la que vas a eliminar'
        };
      }

      const catDestino = await db.categorias.get(destinoNombre);
      if (!catDestino) {
        return {
          ok: false as const,
          error: `La categoría destino "${destinoNombre}" no existe`
        };
      }
      if (catDestino.tipo !== cat.tipo) {
        return {
          ok: false as const,
          error: `La categoría destino debe ser de tipo ${cat.tipo}`
        };
      }

      const ahoraIso = new Date().toISOString();
      await db.movimientos
        .where('categoria')
        .equals(nombre)
        .modify({
          categoria: destinoNombre,
          actualizadoEn: ahoraIso
        });
    }

    await db.categorias.delete(nombre);
    return { ok: true as const, reasignados: usoCount };
  });
}

export async function borrarTodosLosMovimientos(): Promise<number> {
  return db.transaction('rw', db.movimientos, async () => {
    const total = await db.movimientos.count();
    await db.movimientos.clear();
    return total;
  });
}

export async function ejecutarResetDeFabrica(
  confirmacionTexto: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (confirmacionTexto.trim().toUpperCase() !== 'RESET') {
    return { ok: false, error: 'Debes escribir exactamente RESET para confirmar' };
  }

  await db.transaction('rw', db.movimientos, db.categorias, db.ajustes, async () => {
    await db.movimientos.clear();
    await db.categorias.clear();
    await db.ajustes.clear();
    await db.categorias.bulkPut([...CATEGORIAS_INICIALES_SEED]);
  });

  return { ok: true };
}

export async function guardarAjuste(clave: string, valor: unknown): Promise<void> {
  await db.ajustes.put({ clave, valor });
}

export async function obtenerAjuste<T>(clave: string): Promise<T | undefined> {
  const item = await db.ajustes.get(clave);
  return item?.valor as T | undefined;
}
