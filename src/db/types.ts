export interface MovimientoRecord {
  id: string;
  fecha: string;
  tipo: 'Ingreso' | 'Gasto';
  categoria: string;
  descripcion: string;
  montoCentavos: number;
  metodo: string;
  observacion: string;
  actualizadoEn: string;
}

export interface CategoriaRecord {
  nombre: string;
  tipo: 'Ingreso' | 'Gasto';
  presupuestoCentavos: number;
}

export interface AjusteRecord {
  clave: string;
  valor: unknown;
}
