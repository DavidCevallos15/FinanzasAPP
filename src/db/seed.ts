import type { CategoriaRecord } from './types';

export const CATEGORIAS_INICIALES_SEED: readonly CategoriaRecord[] = [
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
