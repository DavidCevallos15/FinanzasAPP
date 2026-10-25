import { z } from 'zod';
import { CATEGORIAS_INICIALES_SEED } from '../../db/seed';
import type { CategoriaRecord, MovimientoRecord } from '../../db/types';
import { fechaIsoSchema, tipoMovimientoSchema } from '../../domain/schemas';
import { normalizarTexto, parseMontoACentavos } from '../../lib/money';

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024; // 5 MB
export const DIAS_RECORDATORIO_RESPALDO = 30;

export const CSV_HEADERS_V5 = [
  'ID',
  'Fecha',
  'Tipo',
  'Categoría',
  'Descripción',
  'Monto',
  'Método',
  'Observación',
  'Última modificación'
] as const;

const categoriaBackupSchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre de categoría vacío').max(60),
  tipo: tipoMovimientoSchema,
  presupuestoCentavos: z.number().int().min(0, 'Presupuesto negativo')
});

const movimientoBackupSchema = z.object({
  id: z.string().trim().min(1, 'ID de movimiento vacío').max(100),
  fecha: fechaIsoSchema,
  tipo: tipoMovimientoSchema,
  categoria: z.string().trim().min(1, 'Categoría de movimiento vacía').max(60),
  descripcion: z.string().max(200),
  montoCentavos: z.number().int().gt(0, 'El monto en centavos debe ser mayor a 0'),
  metodo: z.string().max(80),
  observacion: z.string().max(300),
  actualizadoEn: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Fecha actualizadoEn inválida'
  })
});

export const backupJsonSchema = z.object({
  app: z.literal('mis-finanzas'),
  version: z.literal(1),
  exportadoEn: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Fecha de exportación inválida'
  }),
  categorias: z.array(categoriaBackupSchema).min(1, 'El respaldo debe incluir al menos una categoría'),
  movimientos: z.array(movimientoBackupSchema)
});

export type BackupJsonPayload = z.infer<typeof backupJsonSchema>;

export function serializarRespaldoJson(
  categorias: readonly CategoriaRecord[],
  movimientos: readonly MovimientoRecord[],
  exportadoEn = new Date().toISOString()
): string {
  const payload: BackupJsonPayload = {
    app: 'mis-finanzas',
    version: 1,
    exportadoEn,
    categorias: categorias.map((c) => ({
      nombre: c.nombre,
      tipo: c.tipo,
      presupuestoCentavos: c.presupuestoCentavos
    })),
    movimientos: movimientos.map((m) => ({
      id: m.id,
      fecha: m.fecha,
      tipo: m.tipo,
      categoria: m.categoria,
      descripcion: m.descripcion,
      montoCentavos: m.montoCentavos,
      metodo: m.metodo,
      observacion: m.observacion,
      actualizadoEn: m.actualizadoEn
    }))
  };

  return JSON.stringify(payload, null, 2);
}

export function validarRespaldoJsonTexto(
  contenido: string,
  byteLength = new TextEncoder().encode(contenido).byteLength
): { ok: true; data: BackupJsonPayload } | { ok: false; error: string } {
  if (byteLength > MAX_BACKUP_BYTES) {
    return {
      ok: false,
      error: 'El archivo supera el tamaño máximo permitido de 5 MB.'
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(contenido);
  } catch {
    return {
      ok: false,
      error: 'El archivo no tiene un formato JSON válido. Se rechazó por completo.'
    };
  }

  const validacion = backupJsonSchema.safeParse(parsedJson);
  if (!validacion.success) {
    const issue = validacion.error.issues[0];
    const ruta = issue?.path.length ? ` (${issue.path.join('.')})` : '';
    return {
      ok: false,
      error: `Archivo JSON rechazado${ruta}: ${issue?.message ?? 'estructura inválida'}`
    };
  }

  // Verificar que no haya IDs de movimiento duplicados ni categorías duplicadas
  const nombresCat = new Set<string>();
  for (const c of validacion.data.categorias) {
    const k = normalizarTexto(c.nombre);
    if (nombresCat.has(k)) {
      return {
        ok: false,
        error: `Archivo JSON rechazado: categoría duplicada "${c.nombre}".`
      };
    }
    nombresCat.add(k);
  }

  const idsMov = new Set<string>();
  for (const m of validacion.data.movimientos) {
    if (idsMov.has(m.id)) {
      return {
        ok: false,
        error: `Archivo JSON rechazado: ID de movimiento duplicado "${m.id}".`
      };
    }
    idsMov.add(m.id);
  }

  // Garantizar que las categorías de respaldo existan
  const resultadoCategorias = [...validacion.data.categorias];
  for (const base of CATEGORIAS_INICIALES_SEED) {
    if (base.nombre === 'Otros ingresos' || base.nombre === 'Otros gastos') {
      const existe = resultadoCategorias.some(
        (c) => normalizarTexto(c.nombre) === normalizarTexto(base.nombre)
      );
      if (!existe) {
        resultadoCategorias.push({ ...base });
      }
    }
  }

  return {
    ok: true,
    data: {
      ...validacion.data,
      categorias: resultadoCategorias
    }
  };
}

/**
 * Neutraliza la inyección de fórmulas en hojas de cálculo (CSV):
 * Si una celda de texto comienza por =, +, - o @ (o tab/CR), se prefija con comilla simple (').
 */
export function sanitizarCeldaFormulaCsv(valor: string): string {
  if (/^[=+\-@\t\r]/.test(valor)) {
    return `'${valor}`;
  }
  return valor;
}

export function desescaparCeldaFormulaCsv(valor: string): string {
  if (valor.startsWith("'") && valor.length > 1 && /^[=+\-@\t\r]/.test(valor.slice(1))) {
    return valor.slice(1);
  }
  return valor;
}

function escaparCampoCsv(valor: string): string {
  if (/[",\r\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

function fechaIsoACsvV5(fechaIso: string): string {
  const partes = fechaIso.split('-');
  if (partes.length !== 3) return fechaIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function isoAFechaHoraCsvV5(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function exportarMovimientosCsvV5(movimientos: readonly MovimientoRecord[]): string {
  const filas: string[] = [CSV_HEADERS_V5.map(escaparCampoCsv).join(',')];

  for (const m of movimientos) {
    const montoComa = (m.montoCentavos / 100).toFixed(2).replace('.', ',');
    const celdas = [
      sanitizarCeldaFormulaCsv(m.id),
      fechaIsoACsvV5(m.fecha),
      m.tipo,
      sanitizarCeldaFormulaCsv(m.categoria),
      sanitizarCeldaFormulaCsv(m.descripcion),
      montoComa,
      sanitizarCeldaFormulaCsv(m.metodo),
      sanitizarCeldaFormulaCsv(m.observacion),
      isoAFechaHoraCsvV5(m.actualizadoEn)
    ];
    filas.push(celdas.map(escaparCampoCsv).join(','));
  }

  return filas.join('\r\n');
}

function parsearLineasCsv(contenido: string): string[][] {
  const filas: string[][] = [];
  let filaActual: string[] = [];
  let celda = '';
  let enComillas = false;

  for (let i = 0; i < contenido.length; i++) {
    const ch = contenido[i];

    if (enComillas) {
      if (ch === '"') {
        if (contenido[i + 1] === '"') {
          celda += '"';
          i++;
        } else {
          enComillas = false;
        }
      } else {
        celda += ch;
      }
      continue;
    }

    if (ch === '"') {
      enComillas = true;
    } else if (ch === ',') {
      filaActual.push(celda);
      celda = '';
    } else if (ch === '\r') {
      if (contenido[i + 1] === '\n') {
        i++;
      }
      filaActual.push(celda);
      filas.push(filaActual);
      filaActual = [];
      celda = '';
    } else if (ch === '\n') {
      filaActual.push(celda);
      filas.push(filaActual);
      filaActual = [];
      celda = '';
    } else {
      celda += ch;
    }
  }

  if (enComillas) {
    throw new Error('Comillas sin cerrar en el archivo CSV');
  }

  if (celda.length > 0 || filaActual.length > 0) {
    filaActual.push(celda);
    filas.push(filaActual);
  }

  return filas.filter((f) => !(f.length === 1 && f[0]?.trim() === ''));
}

function parsearFechaCsvAIso(valor: string): string | null {
  const limpio = valor.trim();
  const matchSlash = limpio.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchSlash) {
    const dd = String(Number(matchSlash[1])).padStart(2, '0');
    const mm = String(Number(matchSlash[2])).padStart(2, '0');
    const yyyy = matchSlash[3];
    const iso = `${yyyy}-${mm}-${dd}`;
    return fechaIsoSchema.safeParse(iso).success ? iso : null;
  }

  const matchIso = limpio.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (matchIso) {
    const yyyy = matchIso[1];
    const mm = String(Number(matchIso[2])).padStart(2, '0');
    const dd = String(Number(matchIso[3])).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    return fechaIsoSchema.safeParse(iso).success ? iso : null;
  }

  return null;
}

function parsearModificacionCsvAIso(valor: string): string {
  const limpio = valor.trim();
  if (!limpio) return new Date().toISOString();

  const matchV5 = limpio.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (matchV5) {
    const dd = Number(matchV5[1]);
    const mm = Number(matchV5[2]) - 1;
    const yyyy = Number(matchV5[3]);
    const hh = Number(matchV5[4] ?? 0);
    const min = Number(matchV5[5] ?? 0);
    const ss = Number(matchV5[6] ?? 0);
    const d = new Date(Date.UTC(yyyy, mm, dd, hh, min, ss));
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  const parsed = Date.parse(limpio);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  return new Date().toISOString();
}

export function validarEImportarCsvV5(
  contenido: string,
  categoriasExistentes: readonly CategoriaRecord[],
  byteLength = new TextEncoder().encode(contenido).byteLength
):
  | {
      ok: true;
      movimientos: MovimientoRecord[];
      nuevasCategorias: CategoriaRecord[];
    }
  | { ok: false; error: string } {
  if (byteLength > MAX_BACKUP_BYTES) {
    return {
      ok: false,
      error: 'El archivo CSV supera el límite máximo permitido de 5 MB.'
    };
  }

  let filas: string[][];
  try {
    filas = parsearLineasCsv(contenido);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'El archivo CSV está mal formado.'
    };
  }

  if (filas.length < 1) {
    return { ok: false, error: 'El archivo CSV está vacío.' };
  }

  const cabecera = filas[0] ?? [];
  const cabeceraEsperadaNorm = CSV_HEADERS_V5.map((h) => normalizarTexto(h));
  const cabeceraRecibidaNorm = cabecera.map((h) => normalizarTexto(h));

  if (
    cabecera.length !== CSV_HEADERS_V5.length ||
    !cabeceraEsperadaNorm.every((esperada, idx) => cabeceraRecibidaNorm[idx] === esperada)
  ) {
    return {
      ok: false,
      error: `Cabeceras CSV inválidas. Se esperaban exactamente: ${CSV_HEADERS_V5.join(', ')}`
    };
  }

  const canonicoCategorias = new Map<string, CategoriaRecord>();
  for (const cat of categoriasExistentes) {
    canonicoCategorias.set(normalizarTexto(cat.nombre), cat);
  }

  const nuevasCategorias: CategoriaRecord[] = [];
  const movimientos: MovimientoRecord[] = [];
  const idsUsados = new Set<string>();

  for (let i = 1; i < filas.length; i++) {
    const fila = filas[i];
    const numFila = i + 1;
    if (!fila || fila.length !== CSV_HEADERS_V5.length) {
      return {
        ok: false,
        error: `Fila ${numFila}: cantidad de columnas inválida (se esperaban 9 columnas).`
      };
    }

    const idRaw = desescaparCeldaFormulaCsv((fila[0] ?? '').trim());
    const fechaRaw = (fila[1] ?? '').trim();
    const tipoRaw = (fila[2] ?? '').trim();
    const catRaw = desescaparCeldaFormulaCsv((fila[3] ?? '').trim());
    const descRaw = desescaparCeldaFormulaCsv((fila[4] ?? '').trim());
    const montoRaw = (fila[5] ?? '').trim();
    const metodoRaw = desescaparCeldaFormulaCsv((fila[6] ?? '').trim());
    const obsRaw = desescaparCeldaFormulaCsv((fila[7] ?? '').trim());
    const modRaw = (fila[8] ?? '').trim();

    const fechaIso = parsearFechaCsvAIso(fechaRaw);
    if (!fechaIso) {
      return {
        ok: false,
        error: `Fila ${numFila}: la fecha "${fechaRaw}" no es válida (usa dd/MM/yyyy).`
      };
    }

    const tipoParse = tipoMovimientoSchema.safeParse(tipoRaw);
    if (!tipoParse.success) {
      return {
        ok: false,
        error: `Fila ${numFila}: el tipo "${tipoRaw}" debe ser Ingreso o Gasto.`
      };
    }

    if (!catRaw) {
      return {
        ok: false,
        error: `Fila ${numFila}: la categoría está vacía.`
      };
    }

    const montoCentavos = parseMontoACentavos(montoRaw);
    if (montoCentavos === null || montoCentavos <= 0) {
      return {
        ok: false,
        error: `Fila ${numFila}: el monto "${montoRaw}" no es válido o no es mayor a 0.`
      };
    }

    const normCat = normalizarTexto(catRaw);
    let catExistente = canonicoCategorias.get(normCat);
    if (!catExistente) {
      catExistente = {
        nombre: catRaw,
        tipo: tipoParse.data,
        presupuestoCentavos: 0
      };
      canonicoCategorias.set(normCat, catExistente);
      nuevasCategorias.push(catExistente);
    } else if (catExistente.tipo !== tipoParse.data) {
      return {
        ok: false,
        error: `Fila ${numFila}: la categoría "${catExistente.nombre}" es de tipo ${catExistente.tipo}, pero la fila indica ${tipoParse.data}.`
      };
    }

    let idFinal = idRaw || crypto.randomUUID();
    if (idsUsados.has(idFinal)) {
      return {
        ok: false,
        error: `Fila ${numFila}: el ID "${idFinal}" está duplicado en el archivo CSV.`
      };
    }
    idsUsados.add(idFinal);

    const record: MovimientoRecord = {
      id: idFinal,
      fecha: fechaIso,
      tipo: tipoParse.data,
      categoria: catExistente.nombre,
      descripcion: descRaw,
      montoCentavos,
      metodo: metodoRaw || 'Efectivo',
      observacion: obsRaw,
      actualizadoEn: parsearModificacionCsvAIso(modRaw)
    };

    const validacionMov = movimientoBackupSchema.safeParse(record);
    if (!validacionMov.success) {
      return {
        ok: false,
        error: `Fila ${numFila}: ${validacionMov.error.issues[0]?.message ?? 'datos inválidos'}`
      };
    }

    movimientos.push(record);
  }

  return {
    ok: true,
    movimientos,
    nuevasCategorias
  };
}

export function debeMostrarBannerRespaldo(
  cantidadMovimientos: number,
  ultimoRespaldoIso: string | null | undefined,
  ahoraMs = Date.now()
): { mostrar: boolean; diasSinRespaldo: number | null } {
  if (cantidadMovimientos <= 0) {
    return { mostrar: false, diasSinRespaldo: null };
  }

  if (!ultimoRespaldoIso) {
    return { mostrar: true, diasSinRespaldo: null };
  }

  const ultimoMs = Date.parse(ultimoRespaldoIso);
  if (Number.isNaN(ultimoMs)) {
    return { mostrar: true, diasSinRespaldo: null };
  }

  const diffDias = Math.floor((ahoraMs - ultimoMs) / (1000 * 60 * 60 * 24));
  return {
    mostrar: diffDias > DIAS_RECORDATORIO_RESPALDO,
    diasSinRespaldo: Math.max(0, diffDias)
  };
}
