import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import type { CategoriaRecord, MovimientoRecord } from './types';

export function useMovimientos(): readonly MovimientoRecord[] {
  const data = useLiveQuery(async () => {
    const todos = await db.movimientos.toArray();
    return todos.sort((a, b) => {
      if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
      return b.actualizadoEn.localeCompare(a.actualizadoEn);
    });
  }, []);

  return data ?? [];
}

export function useCategorias(): readonly CategoriaRecord[] {
  const data = useLiveQuery(async () => {
    return db.categorias.toArray();
  }, []);

  return data ?? [];
}

export function useAjuste<T>(clave: string, valorPorDefecto: T): T {
  const data = useLiveQuery(async () => {
    const rec = await db.ajustes.get(clave);
    return (rec?.valor as T | undefined) ?? valorPorDefecto;
  }, [clave]);

  return data ?? valorPorDefecto;
}
