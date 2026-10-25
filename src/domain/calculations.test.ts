import { describe, expect, it } from 'vitest';
import type { CategoriaRecord, MovimientoRecord } from '../db/types';
import {
  calcularDashboardMes,
  calcularHistorial,
  evaluarEstadoCategoria,
  evaluarEstadoMes,
  inicioSemanaIso
} from './calculations';

describe('evaluarEstadoMes (umbrales V5)', () => {
  it('devuelve SIN DATOS cuando ingreso=0 y gasto=0', () => {
    const res = evaluarEstadoMes(0, 0);
    expect(res.codigo).toBe('SIN DATOS');
    expect(res.nivel).toBe('neutro');
  });

  it('devuelve CRÍTICO cuando ingreso=0 y gasto>0', () => {
    const res = evaluarEstadoMes(0, 500);
    expect(res.codigo).toBe('CRÍTICO');
    expect(res.nivel).toBe('mal');
  });

  it('evalúa los umbrales exactos: <=0.70 BIEN, <=0.90 ALERTA, <=1.00 RIESGO, >1.00 MAL', () => {
    expect(evaluarEstadoMes(10000, 7000).codigo).toBe('BIEN');
    expect(evaluarEstadoMes(10000, 7001).codigo).toBe('ALERTA');
    expect(evaluarEstadoMes(10000, 9000).codigo).toBe('ALERTA');
    expect(evaluarEstadoMes(10000, 9001).codigo).toBe('RIESGO');
    expect(evaluarEstadoMes(10000, 10000).codigo).toBe('RIESGO');
    expect(evaluarEstadoMes(10000, 10001).codigo).toBe('MAL');
  });
});

describe('evaluarEstadoCategoria (umbrales V5)', () => {
  it('marca Revisar categoría cuando es huérfana', () => {
    const res = evaluarEstadoCategoria(0, 2500, true);
    expect(res.texto).toBe('Revisar categoría');
    expect(res.nivel).toBe('revisar');
  });

  it('evalúa OK (<80%), Cerca del límite (80% a 100%) y Excedido (>100%)', () => {
    expect(evaluarEstadoCategoria(10000, 7999).texto).toBe('OK');
    expect(evaluarEstadoCategoria(10000, 8000).texto).toBe('Cerca del límite');
    expect(evaluarEstadoCategoria(10000, 10000).texto).toBe('Cerca del límite');
    expect(evaluarEstadoCategoria(10000, 10001).texto).toBe('Excedido');
  });

  it('distingue Sin presupuesto y guion cuando presupuesto=0', () => {
    expect(evaluarEstadoCategoria(0, 1500).texto).toBe('Sin presupuesto');
    expect(evaluarEstadoCategoria(0, 0).texto).toBe('—');
  });
});

describe('Criterio de aceptación de Fase 3 (Plan.md línea 96)', () => {
  const categorias: CategoriaRecord[] = [
    { nombre: 'Sueldo', tipo: 'Ingreso', presupuestoCentavos: 0 },
    { nombre: 'Transporte', tipo: 'Gasto', presupuestoCentavos: 5000 },
    { nombre: 'Alimentación', tipo: 'Gasto', presupuestoCentavos: 10000 },
    { nombre: 'Telefonía', tipo: 'Gasto', presupuestoCentavos: 2000 },
    { nombre: 'Antojos', tipo: 'Gasto', presupuestoCentavos: 4000 }, // $40.00
    { nombre: 'Ahorro Laptop', tipo: 'Gasto', presupuestoCentavos: 10000 } // $100.00
  ];

  const movimientos: MovimientoRecord[] = [
    {
      id: '1',
      fecha: '2026-10-02',
      tipo: 'Ingreso',
      categoria: 'Sueldo',
      descripcion: 'Pago mensual',
      montoCentavos: 40000, // $400.00
      metodo: 'Transferencia',
      observacion: '',
      actualizadoEn: '2026-10-02T10:00:00.000Z'
    },
    {
      id: '2',
      fecha: '2026-10-05',
      tipo: 'Gasto',
      categoria: 'Transporte',
      descripcion: 'Bus',
      montoCentavos: 1200, // $12.00
      metodo: 'Efectivo',
      observacion: '',
      actualizadoEn: '2026-10-05T10:00:00.000Z'
    },
    {
      id: '3',
      fecha: '2026-10-07',
      tipo: 'Gasto',
      categoria: 'Alimentación',
      descripcion: 'Mercado',
      montoCentavos: 2500, // $25.00
      metodo: 'Efectivo',
      observacion: '',
      actualizadoEn: '2026-10-07T10:00:00.000Z'
    },
    {
      id: '4',
      fecha: '2026-10-10',
      tipo: 'Gasto',
      categoria: 'Telefonía',
      descripcion: 'Recarga',
      montoCentavos: 500, // $5.00
      metodo: 'Transferencia',
      observacion: '',
      actualizadoEn: '2026-10-10T10:00:00.000Z'
    },
    {
      id: '5',
      fecha: '2026-10-12',
      tipo: 'Gasto',
      categoria: 'Antojos',
      descripcion: 'Postres y salidas',
      montoCentavos: 4150, // $41.50
      metodo: 'Efectivo',
      observacion: '',
      actualizadoEn: '2026-10-12T10:00:00.000Z'
    },
    {
      id: '6',
      fecha: '2026-10-15',
      tipo: 'Gasto',
      categoria: 'Ahorro Laptop',
      descripcion: 'Cuota ahorro',
      montoCentavos: 10000, // $100.00
      metodo: 'Transferencia',
      observacion: '',
      actualizadoEn: '2026-10-15T10:00:00.000Z'
    }
  ];

  it('calcula estado BIEN (183,50 / 400 = 45,875% -> 45,9%), Antojos Excedido y Ahorro Laptop Cerca del límite', () => {
    const dash = calcularDashboardMes(movimientos, categorias, '2026-10');

    expect(dash.ingresosMesCentavos).toBe(40000);
    expect(dash.gastosMesCentavos).toBe(18350);
    expect(dash.saldoMesCentavos).toBe(21650);
    expect(dash.porcentajeGastadoMes).toBeCloseTo(0.45875, 5);
    expect(dash.estadoMes.codigo).toBe('BIEN');

    const filaAntojos = dash.filasPresupuesto.find((f) => f.categoria === 'Antojos');
    expect(filaAntojos?.estado).toBe('Excedido');
    expect(filaAntojos?.disponibleCentavos).toBe(-150);

    const filaLaptop = dash.filasPresupuesto.find((f) => f.categoria === 'Ahorro Laptop');
    expect(filaLaptop?.porcentajeUsado).toBe(1);
    expect(filaLaptop?.estado).toBe('Cerca del límite');
  });

  it('calcula historial mensual y anual e inicio de semana ISO correctamente', () => {
    expect(inicioSemanaIso('2026-10-24')).toBe('2026-10-19'); // Sábado 24 -> Lunes 19
    expect(inicioSemanaIso('2026-10-25')).toBe('2026-10-19'); // Domingo 25 -> Lunes 19

    const hist = calcularHistorial(movimientos);
    expect(hist.porMes).toHaveLength(1);
    expect(hist.porMes[0]?.mesClave).toBe('2026-10');
    expect(hist.porMes[0]?.cantidadMovimientos).toBe(6);
    expect(hist.porAnio).toHaveLength(1);
    expect(hist.porAnio[0]?.anio).toBe('2026');
    expect(hist.porAnio[0]?.saldoCentavos).toBe(21650);
  });
});
