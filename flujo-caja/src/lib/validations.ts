import { z } from "zod";

export const transaccionSchema = z
  .object({
    tipo: z.enum(["ingreso", "egreso"]),
    categoriaId: z.string().uuid("Selecciona una subcategoría"),
    clienteId: z.string().uuid().optional().nullable(),
    moneda: z.enum(["COP", "USD"]),
    montoOriginal: z.coerce.number().positive("El monto debe ser mayor a cero").finite(),
    tasaCambio: z.coerce.number().positive().finite().default(1),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    descripcion: z.string().min(1, "Agrega una descripción").max(280),
    metodoPago: z.string().max(40).optional().nullable(),
    comprobanteUrl: z.string().url().optional().nullable(),
    comprobantePathname: z.string().optional().nullable(),
    esRecurrente: z.boolean().default(false),
    frecuencia: z.enum(["mensual", "quincenal", "semanal"]).optional().nullable(),
    esProyectada: z.boolean().default(false),
  })
  .refine((d) => d.moneda === "COP" || d.tasaCambio > 0, {
    message: "La tasa de cambio es obligatoria para montos en USD",
    path: ["tasaCambio"],
  })
  .refine((d) => !d.esRecurrente || !!d.frecuencia, {
    message: "Elige la frecuencia de la recurrencia",
    path: ["frecuencia"],
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
  saldoInicialFecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  cajaMinimaCop: z.coerce.number().finite().nonnegative(),
  horizonteProyeccionSemanas: z.coerce.number().int().min(1).max(26).default(8),
  monedaPorDefecto: z.enum(["COP", "USD"]).default("COP"),
  tasaCambioSugerida: z.coerce.number().positive().finite().optional().nullable(),
  requerirComprobante: z.boolean().default(false),
  diasAlertaInactividad: z.coerce.number().int().nonnegative().default(0),
});

export type ConfigInput = z.infer<typeof configSchema>;

export const obligacionSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio").max(120),
  periodicidad: z.enum(["mensual", "bimestral", "cuatrimestral", "anual", "otra"]),
  proximoVencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  diasAnticipacion: z.coerce.number().int().nonnegative().max(60).default(5),
  montoEstimadoCop: z.coerce.number().nonnegative().finite().optional().nullable(),
  nota: z.string().max(280).optional().nullable(),
});

export type ObligacionInput = z.infer<typeof obligacionSchema>;
