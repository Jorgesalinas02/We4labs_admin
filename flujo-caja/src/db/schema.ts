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
  foreignKey,
  type AnyPgColumn,
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
// Si una categoría madre exige, sugiere o no aplica asociar cliente.
export const pideClienteEnum = pgEnum("pide_cliente", ["si", "opcional", "no"]);
export const monedaEnum = pgEnum("moneda", ["COP", "USD"]);
export const frecuenciaEnum = pgEnum("frecuencia", [
  "mensual",
  "quincenal",
  "semanal",
]);
export const estadoTransaccionEnum = pgEnum("estado_transaccion", [
  "activa",
  "eliminada",
]);
export const periodicidadEnum = pgEnum("periodicidad", [
  "mensual",
  "bimestral",
  "cuatrimestral",
  "anual",
  "otra",
]);
export const estadoObligacionEnum = pgEnum("estado_obligacion", [
  "pendiente",
  "pagada",
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
// Categorías a dos niveles (madre + subcategoría, auto-referencia)
//   - categoriaMadreId NULL  -> es una Categoría madre
//   - categoriaMadreId valor -> es una Subcategoría de esa madre
//   - pideCliente aplica en la madre (si/opcional/no) y la heredan sus subs
// ---------------------------------------------------------------------------
export const categorias = pgTable(
  "categorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: text("nombre").notNull(),
    tipo: tipoMovimientoEnum("tipo").notNull(),
    categoriaMadreId: uuid("categoria_madre_id"),
    pideCliente: pideClienteEnum("pide_cliente").notNull().default("no"),
    // Marca la madre "Costos directos" para el cálculo de rentabilidad por cliente.
    esCostoDirecto: boolean("es_costo_directo").notNull().default(false),
    descripcionDummies: text("descripcion_dummies").notNull().default(""),
    orden: integer("orden").notNull().default(0),
    activa: boolean("activa").notNull().default(true),
  },
  (t) => ({
    madreFk: foreignKey({
      columns: [t.categoriaMadreId],
      foreignColumns: [t.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Transacciones (NUMERIC para dinero — nunca float; soft delete)
//   - categoriaId apunta a una SUBcategoría
//   - esProyectada distingue una fila "esperada" de una transacción real
// ---------------------------------------------------------------------------
export const transacciones = pgTable("transacciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: tipoMovimientoEnum("tipo").notNull(),
  categoriaId: uuid("categoria_id")
    .notNull()
    .references((): AnyPgColumn => categorias.id),
  clienteId: uuid("cliente_id").references(() => clientes.id),
  moneda: monedaEnum("moneda").notNull().default("COP"),
  montoOriginal: numeric("monto_original", { precision: 15, scale: 2 }).notNull(),
  tasaCambio: numeric("tasa_cambio", { precision: 12, scale: 4 })
    .notNull()
    .default("1"),
  montoCop: numeric("monto_cop", { precision: 15, scale: 2 }).notNull(),
  fecha: date("fecha").notNull(),
  descripcion: text("descripcion").notNull(),
  metodoPago: varchar("metodo_pago", { length: 40 }),
  comprobanteUrl: text("comprobante_url"),
  comprobantePathname: text("comprobante_pathname"),
  // --- Recurrencia / proyección ---
  esRecurrente: boolean("es_recurrente").notNull().default(false),
  frecuencia: frecuenciaEnum("frecuencia"),
  esProyectada: boolean("es_proyectada").notNull().default(false),
  creadoPor: text("creado_por").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  estado: estadoTransaccionEnum("estado").notNull().default("activa"),
});

// ---------------------------------------------------------------------------
// Obligaciones tributarias (calendario)
// ---------------------------------------------------------------------------
export const obligacionesTributarias = pgTable("obligaciones_tributarias", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  periodicidad: periodicidadEnum("periodicidad").notNull().default("mensual"),
  proximoVencimiento: date("proximo_vencimiento"),
  diasAnticipacion: integer("dias_anticipacion").notNull().default(5),
  montoEstimadoCop: numeric("monto_estimado_cop", { precision: 15, scale: 2 }),
  estado: estadoObligacionEnum("estado").notNull().default("pendiente"),
  transaccionId: uuid("transaccion_id").references(() => transacciones.id),
  nota: text("nota"),
  activa: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Configuración global (fila única id = 1)
// ---------------------------------------------------------------------------
export const config = pgTable("config", {
  id: integer("id").primaryKey().default(1),
  saldoInicialCop: numeric("saldo_inicial_cop", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  saldoInicialFecha: date("saldo_inicial_fecha"),
  // Caja mínima: colchón de liquidez de referencia (antes "umbral de alerta").
  cajaMinimaCop: numeric("caja_minima_cop", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  horizonteProyeccionSemanas: integer("horizonte_proyeccion_semanas")
    .notNull()
    .default(8),
  // --- Preferencias del formulario de transacciones ---
  monedaPorDefecto: monedaEnum("moneda_por_defecto").notNull().default("COP"),
  tasaCambioSugerida: numeric("tasa_cambio_sugerida", { precision: 12, scale: 4 }),
  // --- Reglas de captura ---
  requerirComprobante: boolean("requerir_comprobante").notNull().default(false),
  requerirClienteIngresos: boolean("requerir_cliente_ingresos")
    .notNull()
    .default(false),
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
export type ObligacionTributaria = typeof obligacionesTributarias.$inferSelect;
