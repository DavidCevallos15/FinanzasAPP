const usdFormatter = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const pctFormatter = new Intl.NumberFormat('es-EC', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic'
] as const;

export function formatCentavos(centavos: number): string {
  const dolares = centavos / 100;
  return usdFormatter.format(dolares);
}

export function formatPorcentaje(proporcion: number): string {
  return pctFormatter.format(proporcion);
}

export function formatEtiquetaMes(claveMes: string): string {
  const partes = claveMes.split('-');
  if (partes.length !== 2) return claveMes;
  const anio = partes[0];
  const mesIdx = Number(partes[1]) - 1;
  const nombreMes = MESES_CORTOS[mesIdx];
  if (!nombreMes || !anio) return claveMes;
  return `${nombreMes} ${anio}`;
}

export function formatFechaCorta(fechaIso: string): string {
  const partes = fechaIso.split('-');
  if (partes.length !== 3) return fechaIso;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function hoyIso(): string {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function mesActualClave(): string {
  return hoyIso().slice(0, 7);
}
