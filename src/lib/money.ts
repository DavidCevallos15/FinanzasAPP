export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Convierte un texto o número ingresado por el usuario (ej. "41,50", "41.50", "1.234,56")
 * a centavos enteros redondeados. Devuelve null si no es un número válido.
 */
export function parseMontoACentavos(entrada: string | number): number | null {
  if (typeof entrada === 'number') {
    if (!Number.isFinite(entrada)) return null;
    return Math.round(entrada * 100);
  }

  let limpio = entrada.replace(/[$\s]/g, '').trim();
  if (!limpio) return null;

  if (limpio.includes(',') && limpio.includes('.')) {
    limpio =
      limpio.lastIndexOf(',') > limpio.lastIndexOf('.')
        ? limpio.replace(/\./g, '').replace(',', '.')
        : limpio.replace(/,/g, '');
  } else if (limpio.includes(',')) {
    limpio = limpio.replace(',', '.');
  }

  if (!/^-?\d+(\.\d{1,4})?$/.test(limpio)) {
    return null;
  }

  const valor = Number.parseFloat(limpio);
  if (!Number.isFinite(valor)) return null;
  return Math.round(valor * 100);
}

export function centavosAInputDecimal(centavos: number): string {
  const dolares = (centavos / 100).toFixed(2);
  return dolares.replace('.', ',');
}
