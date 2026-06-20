import { z } from "zod";

export const transaccionSchema = z
  .object({
    tipo: z.enum(["ingreso", "egreso"]),
    categoriaId: z.string().uuid("Selecciona una categoría"),
    clienteId: z.string().uuid().optional().nullable(),
    moneda: z.enum(["COP", "USD"]),
    montoOriginal: z.coerce
      .number()
      .positive("El monto debe ser mayor a cero")
      .finite(),
    tasaCambio: z.coerce.number().positive().finite().default(1),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    descripcion: z.string().min(1, "Agrega una descripción").max(280),
    metodoPago: z.string().max(40).optional().nullable(),
    comprobanteUrl: z.string().url().optional().nullable(),
    comprobantePathname: z.string().optional().nullable(),
  })
  .refine((d) => d.moneda === "COP" || d.tasaCambio > 0, {
    message: "La tasa de cambio es obligatoria para montos en USD",
    path: ["tasaCambio"],
  });

export type TransaccionInput = z.infer<typeof transaccionSchema>;

export const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120),
  tipoRelacion: z.enum(["anticipo", "recurrente", "ambos"]),
  estado: z.enum(["activo", "inactivo"]).default("activo"),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export const configSchema = z.object({
  saldoInicialCop: z.coerce.number().finite(),
  saldoInicialFecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  umbralAlertaCop: z.coerce.number().finite().nonnegative(),
});

export type ConfigInput = z.infer<typeof configSchema>;
