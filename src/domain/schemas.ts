import { z } from 'zod';
import type { CategoriaRecord } from '../db/types';

export const tipoMovimientoSchema = z.enum(['Ingreso', 'Gasto']);

export const fechaIsoSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ingresa una fecha válida (AAAA-MM-DD)')
  .refine((val) => {
    const [yStr, mStr, dStr] = val.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    const dt = new Date(y, m - 1, d);
    return (
      !Number.isNaN(dt.getTime()) &&
      dt.getFullYear() === y &&
      dt.getMonth() === m - 1 &&
      dt.getDate() === d
    );
  }, 'La fecha ingresada no existe en el calendario');

export const movimientoInputSchema = z.object({
  fecha: fechaIsoSchema,
  tipo: tipoMovimientoSchema,
  categoria: z.string().trim().min(1, 'Selecciona una categoría'),
  descripcion: z.string().trim().max(200, 'Máximo 200 caracteres'),
  montoCentavos: z
    .number({ invalid_type_error: 'Ingresa un monto válido' })
    .int('El monto debe expresarse en centavos enteros')
    .gt(0, 'El monto debe ser mayor a cero'),
  metodo: z.string().trim().max(80, 'Máximo 80 caracteres'),
  observacion: z.string().trim().max(300, 'Máximo 300 caracteres')
});

export type MovimientoInput = z.infer<typeof movimientoInputSchema>;

export function validarMovimientoConCategorias(
  input: unknown,
  categorias: readonly CategoriaRecord[]
): { ok: true; data: MovimientoInput } | { ok: false; error: string } {
  const parsed = movimientoInputSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { ok: false, error: firstIssue?.message ?? 'Datos de movimiento inválidos' };
  }

  const cat = categorias.find((c) => c.nombre === parsed.data.categoria);
  if (!cat) {
    return {
      ok: false,
      error: `La categoría "${parsed.data.categoria}" no existe`
    };
  }
  if (cat.tipo !== parsed.data.tipo) {
    return {
      ok: false,
      error: `"${parsed.data.categoria}" es de tipo ${cat.tipo}, no ${parsed.data.tipo}`
    };
  }

  return { ok: true, data: parsed.data };
}

export const categoriaInputSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre de la categoría es obligatorio')
    .max(60, 'Máximo 60 caracteres'),
  tipo: tipoMovimientoSchema,
  presupuestoCentavos: z
    .number({ invalid_type_error: 'Ingresa un presupuesto válido' })
    .int('El presupuesto debe estar en centavos enteros')
    .min(0, 'El presupuesto no puede ser negativo')
});

export type CategoriaInput = z.infer<typeof categoriaInputSchema>;
