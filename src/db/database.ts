import Dexie, { type Table } from 'dexie';
import { CATEGORIAS_INICIALES_SEED } from './seed';
import type { AjusteRecord, CategoriaRecord, MovimientoRecord } from './types';

export class MisFinanzasDB extends Dexie {
  movimientos!: Table<MovimientoRecord, string>;
  categorias!: Table<CategoriaRecord, string>;
  ajustes!: Table<AjusteRecord, string>;

  constructor() {
    super('mis-finanzas');
    this.version(1).stores({
      movimientos: 'id, fecha, tipo, categoria, actualizadoEn',
      categorias: 'nombre, tipo',
      ajustes: 'clave'
    });
  }
}

export const db = new MisFinanzasDB();

let inicializandoPromesa: Promise<void> | null = null;

export function asegurarSemillaInicial(): Promise<void> {
  if (!inicializandoPromesa) {
    inicializandoPromesa = db
      .transaction('rw', db.categorias, db.ajustes, async () => {
        const count = await db.categorias.count();
        if (count === 0) {
          await db.categorias.bulkPut([...CATEGORIAS_INICIALES_SEED]);
        }
      })
      .finally(() => {
        inicializandoPromesa = null;
      });
  }
  return inicializandoPromesa;
}
