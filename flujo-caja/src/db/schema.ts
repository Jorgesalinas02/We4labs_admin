import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  numeric,
  date,
  timestamp,
  boolean,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const rolEnum = pgEnum("rol", ["admin", "visor"]);
export const estadoUsuarioEnum = pgEnum("estado_usuario", ["activo", "inactivo"]);
export const tipoRelacionEnum = pgEnum("tipo_relacion", [
  "anticipo",
  "recurrente",
  "ambos",
]);
export const estadoClienteEnum = pgEnum("estado_cliente", ["activo", "inactivo"]);
export const tipoMovimientoEnum = pgEnum("tipo_movimiento", ["ingreso", "egreso"]);
// Grupo de gasto: permite agrupar el dashboard aunque se creen categorías nuevas.
export const grupoGastoEnum = pgEnum("grupo_gasto", [
  "nomina",
  "operativo",
  "cliente",
  "admin",
  "marketing",
  "otro",
  "na", // no aplica (categorías de ingreso)
]);
export const monedaEnum = pgEnum("moneda", ["COP", "USD"]);
export const estadoTransaccionEnum = pgEnum("estado_transaccion", [
  "activa",
  "eliminada",
]);
export const accionAuditoriaEnum = pgEnum("accion_auditoria", [
  "login",
  "crear",
  "editar",
  "eliminar",
  "invitar",
  "cambiar_rol",
]);

// ---------------------------------------------------------------------------
// Usuarios (espejo local de Clerk; el rol también vive en Clerk publicMetadata)
// ---------------------------------------------------------------------------
export const usuarios = pgTable("usuarios", {
  clerkId: text("clerk_id").primaryKey(),
  email: text("email").notNull(),
  nombre: text("nombre"),
  rol: rolEnum("rol").notNull().default("visor"),
  estado: estadoUsuarioEnum("estado").notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Clientes / Proyectos
// ---------------------------------------------------------------------------
export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  tipoRelacion: tipoRelacionEnum("tipo_relacion").notNull().default("ambos"),
  estado: estadoClienteEnum("estado").notNull().default("activo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Categorías (predefinidas + las que agregue un Admin)
// ---------------------------------------------------------------------------
export const categorias = pgTable("categorias", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  tipo: tipoMovimientoEnum("tipo").notNull(),
  grupoGasto: grupoGastoEnum("grupo_gasto").notNull().default("na"),
  descripcionDummies: text("descripcion_dummies").notNull(),
  activa: boolean("activa").notNull().default(true),
});

// ---------------------------------------------------------------------------
// Transacciones (NUMERIC para dinero — nunca float; soft delete)
// ---------------------------------------------------------------------------
export const transacciones = pgTable("transacciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: tipoMovimientoEnum("tipo").notNull(),
  categoriaId: uuid("categoria_id")
    .notNull()
    .references(() => categorias.id),
  clienteId: uuid("cliente_id").references(() => clientes.id),
  moneda: monedaEnum("moneda").notNull().default("COP"),
  // Monto en la moneda original tal como entró/salió de la cuenta.
  montoOriginal: numeric("monto_original", { precision: 15, scale: 2 }).notNull(),
  // Tasa de cambio a COP (1 si moneda = COP).
  tasaCambio: numeric("tasa_cambio", { precision: 12, scale: 4 })
    .notNull()
    .default("1"),
  // Monto normalizado en COP — base de todos los cálculos del dashboard.
  montoCop: numeric("monto_cop", { precision: 15, scale: 2 }).notNull(),
  fecha: date("fecha").notNull(),
  descripcion: text("descripcion").notNull(),
  metodoPago: varchar("metodo_pago", { length: 40 }),
  comprobanteUrl: text("comprobante_url"),
  comprobantePathname: text("comprobante_pathname"),
  creadoPor: text("creado_por").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  estado: estadoTransaccionEnum("estado").notNull().default("activa"),
});

// ---------------------------------------------------------------------------
// Configuración global (fila única id = 1)
// ---------------------------------------------------------------------------
export const config = pgTable("config", {
  id: integer("id").primaryKey().default(1),
  // --- Saldo / alertas ---
  saldoInicialCop: numeric("saldo_inicial_cop", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  saldoInicialFecha: date("saldo_inicial_fecha"),
  umbralAlertaCop: numeric("umbral_alerta_cop", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  // --- Preferencias del formulario de transacciones ---
  monedaPorDefecto: monedaEnum("moneda_por_defecto").notNull().default("COP"),
  // Tasa USD→COP sugerida para prellenar el formulario (editable por transacción).
  tasaCambioSugerida: numeric("tasa_cambio_sugerida", { precision: 12, scale: 4 }),
  // --- Reglas de captura ---
  requerirComprobante: boolean("requerir_comprobante").notNull().default(false),
  requerirClienteIngresos: boolean("requerir_cliente_ingresos")
    .notNull()
    .default(false),
  // Días sin registrar transacciones tras los que se recordará (0 = sin recordatorio).
  diasAlertaInactividad: integer("dias_alerta_inactividad").notNull().default(0),
  zonaHoraria: text("zona_horaria").notNull().default("America/Bogota"),
});

// ---------------------------------------------------------------------------
// Log de auditoría (inmutable — solo inserciones)
// ---------------------------------------------------------------------------
export const logAuditoria = pgTable("log_auditoria", {
  id: uuid("id").primaryKey().defaultRandom(),
  usuario: text("usuario").notNull(),
  usuarioEmail: text("usuario_email"),
  accion: accionAuditoriaEnum("accion").notNull(),
  entidad: text("entidad").notNull(),
  entidadId: text("entidad_id"),
  valoresAntes: jsonb("valores_antes"),
  valoresDespues: jsonb("valores_despues"),
  detalle: text("detalle"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Transaccion = typeof transacciones.$inferSelect;
export type NuevaTransaccion = typeof transacciones.$inferInsert;
export type Cliente = typeof clientes.$inferSelect;
export type Categoria = typeof categorias.$inferSelect;
export type Usuario = typeof usuarios.$inferSelect;
