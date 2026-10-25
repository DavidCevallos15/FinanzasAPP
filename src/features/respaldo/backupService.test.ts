import { describe, expect, it } from 'vitest';
import { CATEGORIAS_INICIALES_SEED } from '../../db/seed';
import type { MovimientoRecord } from '../../db/types';
import {
  MAX_BACKUP_BYTES,
  debeMostrarBannerRespaldo,
  exportarMovimientosCsvV5,
  sanitizarCeldaFormulaCsv,
  serializarRespaldoJson,
  validarEImportarCsvV5,
  validarRespaldoJsonTexto
} from './backupService';

const movimientosEjemplo: MovimientoRecord[] = [
  {
    id: 'MOV-261012-ABC123',
    fecha: '2026-10-12',
    tipo: 'Gasto',
    categoria: 'Antojos',
    descripcion: 'Helado y café',
    montoCentavos: 4150,
    metodo: 'Efectivo',
    observacion: 'Salida de fin de semana',
    actualizadoEn: '2026-10-12T15:30:00.000Z'
  },
  {
    id: 'MOV-261002-DEF456',
    fecha: '2026-10-02',
    tipo: 'Ingreso',
    categoria: 'Sueldo',
    descripcion: 'Pago mensual',
    montoCentavos: 40000,
    metodo: 'Transferencia',
    observacion: '',
    actualizadoEn: '2026-10-02T09:00:00.000Z'
  }
];

describe('Respaldo JSON (serialización y validación estricta)', () => {
  it('exportar e importar JSON deja las categorías y movimientos idénticos', () => {
    const json = serializarRespaldoJson(
      CATEGORIAS_INICIALES_SEED,
      movimientosEjemplo,
      '2026-10-24T12:00:00.000Z'
    );
    const resultado = validarRespaldoJsonTexto(json);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.data.categorias).toEqual(CATEGORIAS_INICIALES_SEED);
      expect(resultado.data.movimientos).toEqual(movimientosEjemplo);
    }
  });

  it('rechaza el archivo JSON entero si un movimiento fue manipulado con monto negativo o fecha inválida', () => {
    const manipulado = JSON.stringify({
      app: 'mis-finanzas',
      version: 1,
      exportadoEn: '2026-10-24T12:00:00.000Z',
      categorias: CATEGORIAS_INICIALES_SEED,
      movimientos: [
        {
          ...movimientosEjemplo[0],
          montoCentavos: -500
        }
      ]
    });

    const resultado = validarRespaldoJsonTexto(manipulado);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error).toContain('Archivo JSON rechazado');
    }
  });

  it('rechaza archivos que superen los 5 MB', () => {
    const resultado = validarRespaldoJsonTexto('{}', MAX_BACKUP_BYTES + 1);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error).toContain('5 MB');
    }
  });
});

describe('Respaldo CSV V5 (exportación, neutralización de fórmulas e importación)', () => {
  it('neutraliza celdas que inician con =, +, - o @ en el CSV', () => {
    expect(sanitizarCeldaFormulaCsv('=SUM(A1:A5)')).toBe("'=SUM(A1:A5)");
    expect(sanitizarCeldaFormulaCsv('+cmd|calc')).toBe("'+cmd|calc");
    expect(sanitizarCeldaFormulaCsv('-100')).toBe("'-100");
    expect(sanitizarCeldaFormulaCsv('@import')).toBe("'@import");
    expect(sanitizarCeldaFormulaCsv('Almuerzo normal')).toBe('Almuerzo normal');
  });

  it('exporta a CSV en formato hoja V5 (dd/MM/yyyy y decimal con coma) y reimporta idéntico', () => {
    const csv = exportarMovimientosCsvV5(movimientosEjemplo);
    expect(csv).toContain('12/10/2026');
    expect(csv).toContain('"41,50"');

    const importado = validarEImportarCsvV5(csv, CATEGORIAS_INICIALES_SEED);
    expect(importado.ok).toBe(true);
    if (importado.ok) {
      expect(importado.movimientos).toHaveLength(2);
      expect(importado.movimientos[0]?.montoCentavos).toBe(4150);
      expect(importado.movimientos[0]?.fecha).toBe('2026-10-12');
      expect(importado.movimientos[1]?.montoCentavos).toBe(40000);
    }
  });

  it('rechaza el CSV entero si una fila tiene fecha o monto inválido', () => {
    const csvInvalido = [
      'ID,Fecha,Tipo,Categoría,Descripción,Monto,Método,Observación,Última modificación',
      'MOV-1,31/02/2026,Gasto,Alimentación,Compra,"15,00",Efectivo,,10/10/2026 10:00'
    ].join('\r\n');

    const res = validarEImportarCsvV5(csvInvalido, CATEGORIAS_INICIALES_SEED);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toContain('Fila 2');
    }
  });
});

describe('Banner de recordatorio de respaldo (>30 días)', () => {
  const ahora = Date.parse('2026-10-24T12:00:00.000Z');

  it('no muestra el banner si no hay movimientos', () => {
    expect(debeMostrarBannerRespaldo(0, null, ahora).mostrar).toBe(false);
  });

  it('muestra el banner si hay movimientos y pasaron más de 30 días', () => {
    const hace35Dias = '2026-09-19T12:00:00.000Z';
    const res = debeMostrarBannerRespaldo(5, hace35Dias, ahora);
    expect(res.mostrar).toBe(true);
    expect(res.diasSinRespaldo).toBe(35);
  });

  it('no muestra el banner si el último respaldo fue hace 10 días', () => {
    const hace10Dias = '2026-10-14T12:00:00.000Z';
    const res = debeMostrarBannerRespaldo(5, hace10Dias, ahora);
    expect(res.mostrar).toBe(false);
  });
});
