export type TipoMovimiento = 'Ingreso' | 'Gasto';

export const METODOS_PAGO = [
  'Efectivo',
  'Transferencia',
  'Tarjeta de débito',
  'Tarjeta de crédito',
  'Otro'
] as const;

export const CATEGORIA_RESPALDO: Record<TipoMovimiento, string> = {
  Ingreso: 'Otros ingresos',
  Gasto: 'Otros gastos'
};
