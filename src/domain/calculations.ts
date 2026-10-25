import type { NivelEstadoVisual } from '../components/ui/BadgeEstado';
import type { CategoriaRecord, MovimientoRecord } from '../db/types';
import { formatEtiquetaMes } from '../lib/format';

export const UMBRAL_MES = {
  BIEN: 0.7,
  ALERTA: 0.9,
  RIESGO: 1.0
} as const;

export const UMBRAL_CATEGORIA = {
  CERCA_LIMITE: 0.8,
  EXCEDIDO: 1.0
} as const;

export type CodigoEstadoMes =
  | 'SIN DATOS'
  | 'CRÍTICO'
  | 'BIEN'
  | 'ALERTA'
  | 'RIESGO'
  | 'MAL';

export interface EstadoMesResultado {
  codigo: CodigoEstadoMes;
  descripcion: string;
  nivel: NivelEstadoVisual;
  proporcionGastada: number | null;
}

export type TextoEstadoCategoria =
  | 'Revisar categoría'
  | 'Excedido'
  | 'Cerca del límite'
  | 'OK'
  | 'Sin presupuesto'
  | '—';

export interface EstadoCategoriaResultado {
  texto: TextoEstadoCategoria;
  nivel: NivelEstadoVisual;
  porcentajeUsado: number | null;
}

export interface FilaPresupuestoCategoria {
  categoria: string;
  presupuestoCentavos: number;
  gastadoCentavos: number;
  disponibleCentavos: number;
  porcentajeUsado: number | null;
  estado: TextoEstadoCategoria;
  nivel: NivelEstadoVisual;
  huerfana: boolean;
}

export interface TotalPresupuestoMes {
  presupuestoCentavos: number;
  gastadoCentavos: number;
  disponibleCentavos: number;
  porcentajeUsado: number | null;
}

export interface SerieIngresosGastos {
  clave: string;
  etiqueta: string;
  ingresosCentavos: number;
  gastosCentavos: number;
}

export interface GastoCategoriaGrafico {
  categoria: string;
  gastadoCentavos: number;
  porcentajeDelTotal: number;
}

export interface DashboardMesResultado {
  mesClave: string;
  etiquetaMes: string;
  anioClave: string;
  ingresosMesCentavos: number;
  gastosMesCentavos: number;
  saldoMesCentavos: number;
  porcentajeGastadoMes: number;
  estadoMes: EstadoMesResultado;
  saldoAcumuladoCentavos: number;
  ingresosAnioCentavos: number;
  gastosAnioCentavos: number;
  filasPresupuesto: FilaPresupuestoCategoria[];
  totalPresupuesto: TotalPresupuestoMes;
  semanasDelMes: SerieIngresosGastos[];
  ultimosDoceMeses: SerieIngresosGastos[];
  gastosPorCategoriaMes: GastoCategoriaGrafico[];
}

export interface FilaHistorialMes {
  mesClave: string;
  etiquetaMes: string;
  ingresosCentavos: number;
  gastosCentavos: number;
  saldoCentavos: number;
  porcentajeGastado: number | null;
  estado: EstadoMesResultado;
  cantidadMovimientos: number;
}

export interface FilaHistorialAnio {
  anio: string;
  ingresosCentavos: number;
  gastosCentavos: number;
  saldoCentavos: number;
  cantidadMovimientos: number;
}

export interface HistorialResultado {
  porMes: FilaHistorialMes[];
  porAnio: FilaHistorialAnio[];
}

/**
 * Evalúa el estado general del mes a partir de los ingresos y gastos en centavos.
 * Reglas tomadas de la hoja V5:
 * - ingreso=0 y gasto=0 -> "SIN DATOS"
 * - ingreso=0 y gasto>0 -> "CRÍTICO"
 * - p<=0.70 -> "BIEN"; p<=0.90 -> "ALERTA"; p<=1.00 -> "RIESGO"; p>1 -> "MAL"
 */
export function evaluarEstadoMes(
  ingresoCentavos: number,
  gastoCentavos: number
): EstadoMesResultado {
  if (ingresoCentavos === 0 && gastoCentavos === 0) {
    return {
      codigo: 'SIN DATOS',
      descripcion: 'Aún no hay movimientos este mes',
      nivel: 'neutro',
      proporcionGastada: null
    };
  }

  if (ingresoCentavos === 0 && gastoCentavos > 0) {
    return {
      codigo: 'CRÍTICO',
      descripcion: 'Hay gastos pero ningún ingreso registrado',
      nivel: 'mal',
      proporcionGastada: null
    };
  }

  const p = gastoCentavos / ingresoCentavos;

  if (p <= UMBRAL_MES.BIEN) {
    return {
      codigo: 'BIEN',
      descripcion: 'Tus gastos están controlados',
      nivel: 'ok',
      proporcionGastada: p
    };
  }

  if (p <= UMBRAL_MES.ALERTA) {
    return {
      codigo: 'ALERTA',
      descripcion: 'Estás usando gran parte de tus ingresos',
      nivel: 'alerta',
      proporcionGastada: p
    };
  }

  if (p <= UMBRAL_MES.RIESGO) {
    return {
      codigo: 'RIESGO',
      descripcion: 'Estás muy cerca de gastar todos tus ingresos',
      nivel: 'riesgo',
      proporcionGastada: p
    };
  }

  return {
    codigo: 'MAL',
    descripcion: 'Tus gastos superan tus ingresos',
    nivel: 'mal',
    proporcionGastada: p
  };
}

/**
 * Evalúa el estado presupuestario de una categoría de gasto en el mes.
 * Reglas tomadas de la hoja V5:
 * - huerfana -> "Revisar categoría"
 * - presupuesto>0 y pct>1 -> "Excedido"
 * - presupuesto>0 y pct>=0.80 -> "Cerca del límite"
 * - presupuesto>0 -> "OK"
 * - presupuesto=0 y gastado>0 -> "Sin presupuesto"
 * - resto -> "—"
 */
export function evaluarEstadoCategoria(
  presupuestoCentavos: number,
  gastadoCentavos: number,
  huerfana = false
): EstadoCategoriaResultado {
  const pct = presupuestoCentavos > 0 ? gastadoCentavos / presupuestoCentavos : null;

  if (huerfana) {
    return {
      texto: 'Revisar categoría',
      nivel: 'revisar',
      porcentajeUsado: pct
    };
  }

  if (presupuestoCentavos > 0 && pct !== null) {
    if (pct > UMBRAL_CATEGORIA.EXCEDIDO) {
      return {
        texto: 'Excedido',
        nivel: 'mal',
        porcentajeUsado: pct
      };
    }
    if (pct >= UMBRAL_CATEGORIA.CERCA_LIMITE) {
      return {
        texto: 'Cerca del límite',
        nivel: 'alerta',
        porcentajeUsado: pct
      };
    }
    return {
      texto: 'OK',
      nivel: 'ok',
      porcentajeUsado: pct
    };
  }

  if (gastadoCentavos > 0) {
    return {
      texto: 'Sin presupuesto',
      nivel: 'neutro',
      porcentajeUsado: null
    };
  }

  return {
    texto: '—',
    nivel: 'neutro',
    porcentajeUsado: null
  };
}

/**
 * Devuelve la fecha ISO (YYYY-MM-DD) correspondiente al lunes de la semana de `fechaIso`.
 */
export function inicioSemanaIso(fechaIso: string): string {
  const [yStr, mStr, dStr] = fechaIso.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  const diaSemana = fecha.getUTCDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  const diaIso = diaSemana === 0 ? 7 : diaSemana;
  fecha.setUTCDate(fecha.getUTCDate() - (diaIso - 1));

  const yy = fecha.getUTCFullYear();
  const mm = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function etiquetaSemanaCorta(lunesIso: string): string {
  const partes = lunesIso.split('-');
  if (partes.length !== 3) return lunesIso;
  return `Sem ${partes[2]}/${partes[1]}`;
}

export function generarSemanasDelMes(mesClave: string): string[] {
  const [yStr, mStr] = mesClave.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return [];

  const ultimoDia = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const semanasSet = new Set<string>();

  for (let d = 1; d <= ultimoDia; d++) {
    const fechaIso = `${yStr}-${mStr}-${String(d).padStart(2, '0')}`;
    semanasSet.add(inicioSemanaIso(fechaIso));
  }

  return [...semanasSet].sort();
}

export function calcularDashboardMes(
  movimientos: readonly MovimientoRecord[],
  categorias: readonly CategoriaRecord[],
  mesClave: string
): DashboardMesResultado {
  const anioClave = mesClave.slice(0, 4);

  let ingresosMesCentavos = 0;
  let gastosMesCentavos = 0;
  let saldoAcumuladoCentavos = 0;
  let ingresosAnioCentavos = 0;
  let gastosAnioCentavos = 0;

  const gastoCatMes = new Map<string, number>();
  const porMes = new Map<string, { ing: number; gas: number }>();
  const porSemanaMes = new Map<string, { ing: number; gas: number }>();

  for (const semClave of generarSemanasDelMes(mesClave)) {
    porSemanaMes.set(semClave, { ing: 0, gas: 0 });
  }

  for (const m of movimientos) {
    if (m.montoCentavos <= 0) continue;

    const kMes = m.fecha.slice(0, 7);
    const kAnio = m.fecha.slice(0, 4);

    saldoAcumuladoCentavos += m.tipo === 'Ingreso' ? m.montoCentavos : -m.montoCentavos;

    const acumMes = porMes.get(kMes) ?? { ing: 0, gas: 0 };
    if (m.tipo === 'Ingreso') acumMes.ing += m.montoCentavos;
    else acumMes.gas += m.montoCentavos;
    porMes.set(kMes, acumMes);

    if (kAnio === anioClave) {
      if (m.tipo === 'Ingreso') ingresosAnioCentavos += m.montoCentavos;
      else gastosAnioCentavos += m.montoCentavos;
    }

    if (kMes === mesClave) {
      if (m.tipo === 'Ingreso') {
        ingresosMesCentavos += m.montoCentavos;
      } else {
        gastosMesCentavos += m.montoCentavos;
        const nombreCat = m.categoria || '(sin categoría)';
        gastoCatMes.set(nombreCat, (gastoCatMes.get(nombreCat) ?? 0) + m.montoCentavos);
      }

      const kSem = inicioSemanaIso(m.fecha);
      const acumSem = porSemanaMes.get(kSem) ?? { ing: 0, gas: 0 };
      if (m.tipo === 'Ingreso') acumSem.ing += m.montoCentavos;
      else acumSem.gas += m.montoCentavos;
      porSemanaMes.set(kSem, acumSem);
    }
  }

  const saldoMesCentavos = ingresosMesCentavos - gastosMesCentavos;
  const porcentajeGastadoMes =
    ingresosMesCentavos > 0
      ? gastosMesCentavos / ingresosMesCentavos
      : gastosMesCentavos > 0
        ? 1
        : 0;
  const estadoMes = evaluarEstadoMes(ingresosMesCentavos, gastosMesCentavos);

  // Tabla de presupuesto por categoría (Gasto + huérfanas con gasto)
  const filasPresupuesto: FilaPresupuestoCategoria[] = [];
  const nombresGasto = new Set<string>();

  for (const cat of categorias) {
    if (cat.tipo !== 'Gasto') continue;
    nombresGasto.add(cat.nombre);
    const gastado = gastoCatMes.get(cat.nombre) ?? 0;
    const evalCat = evaluarEstadoCategoria(cat.presupuestoCentavos, gastado, false);
    filasPresupuesto.push({
      categoria: cat.nombre,
      presupuestoCentavos: cat.presupuestoCentavos,
      gastadoCentavos: gastado,
      disponibleCentavos: cat.presupuestoCentavos - gastado,
      porcentajeUsado: evalCat.porcentajeUsado,
      estado: evalCat.texto,
      nivel: evalCat.nivel,
      huerfana: false
    });
  }

  for (const [nombreCat, gastado] of gastoCatMes.entries()) {
    if (!nombresGasto.has(nombreCat)) {
      const evalCat = evaluarEstadoCategoria(0, gastado, true);
      filasPresupuesto.push({
        categoria: nombreCat,
        presupuestoCentavos: 0,
        gastadoCentavos: gastado,
        disponibleCentavos: -gastado,
        porcentajeUsado: null,
        estado: evalCat.texto,
        nivel: evalCat.nivel,
        huerfana: true
      });
    }
  }

  const tp = filasPresupuesto.reduce((acc, f) => acc + f.presupuestoCentavos, 0);
  const tg = filasPresupuesto.reduce((acc, f) => acc + f.gastadoCentavos, 0);

  const totalPresupuesto: TotalPresupuestoMes = {
    presupuestoCentavos: tp,
    gastadoCentavos: tg,
    disponibleCentavos: tp - tg,
    porcentajeUsado: tp > 0 ? tg / tp : null
  };

  const semanasDelMes: SerieIngresosGastos[] = [...porSemanaMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, val]) => ({
      clave,
      etiqueta: etiquetaSemanaCorta(clave),
      ingresosCentavos: val.ing,
      gastosCentavos: val.gas
    }));

  if (!porMes.has(mesClave)) {
    porMes.set(mesClave, { ing: 0, gas: 0 });
  }

  const ultimosDoceMeses: SerieIngresosGastos[] = [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([clave, val]) => ({
      clave,
      etiqueta: formatEtiquetaMes(clave),
      ingresosCentavos: val.ing,
      gastosCentavos: val.gas
    }));

  const gastosPorCategoriaMes: GastoCategoriaGrafico[] = [...gastoCatMes.entries()]
    .filter(([, monto]) => monto > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([categoria, gastadoCentavos]) => ({
      categoria,
      gastadoCentavos,
      porcentajeDelTotal: gastosMesCentavos > 0 ? gastadoCentavos / gastosMesCentavos : 0
    }));

  return {
    mesClave,
    etiquetaMes: formatEtiquetaMes(mesClave),
    anioClave,
    ingresosMesCentavos,
    gastosMesCentavos,
    saldoMesCentavos,
    porcentajeGastadoMes,
    estadoMes,
    saldoAcumuladoCentavos,
    ingresosAnioCentavos,
    gastosAnioCentavos,
    filasPresupuesto,
    totalPresupuesto,
    semanasDelMes,
    ultimosDoceMeses,
    gastosPorCategoriaMes
  };
}

export function calcularHistorial(
  movimientos: readonly MovimientoRecord[]
): HistorialResultado {
  const mapaMes = new Map<string, { ing: number; gas: number; n: number }>();
  const mapaAnio = new Map<string, { ing: number; gas: number; n: number }>();

  for (const m of movimientos) {
    if (m.montoCentavos <= 0) continue;
    const kMes = m.fecha.slice(0, 7);
    const kAnio = m.fecha.slice(0, 4);

    const xMes = mapaMes.get(kMes) ?? { ing: 0, gas: 0, n: 0 };
    if (m.tipo === 'Ingreso') xMes.ing += m.montoCentavos;
    else xMes.gas += m.montoCentavos;
    xMes.n += 1;
    mapaMes.set(kMes, xMes);

    const xAnio = mapaAnio.get(kAnio) ?? { ing: 0, gas: 0, n: 0 };
    if (m.tipo === 'Ingreso') xAnio.ing += m.montoCentavos;
    else xAnio.gas += m.montoCentavos;
    xAnio.n += 1;
    mapaAnio.set(kAnio, xAnio);
  }

  const porMes: FilaHistorialMes[] = [...mapaMes.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([mesClave, x]) => ({
      mesClave,
      etiquetaMes: formatEtiquetaMes(mesClave),
      ingresosCentavos: x.ing,
      gastosCentavos: x.gas,
      saldoCentavos: x.ing - x.gas,
      porcentajeGastado: x.ing > 0 ? x.gas / x.ing : null,
      estado: evaluarEstadoMes(x.ing, x.gas),
      cantidadMovimientos: x.n
    }));

  const porAnio: FilaHistorialAnio[] = [...mapaAnio.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([anio, x]) => ({
      anio,
      ingresosCentavos: x.ing,
      gastosCentavos: x.gas,
      saldoCentavos: x.ing - x.gas,
      cantidadMovimientos: x.n
    }));

  return { porMes, porAnio };
}
