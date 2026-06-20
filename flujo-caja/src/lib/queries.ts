import { db } from "@/db";
import {
  transacciones,
  categorias,
  clientes,
  config,
} from "@/db/schema";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";
import { cache } from "react";
import { rangoMesActual, rangoMesAnterior, type RangoFechas } from "./dates";

// Todas las sumas se hacen sobre monto_cop (normalizado) y solo transacciones activas.
const soloActivas = eq(transacciones.estado, "activa");

// cache() dedupe la lectura de config dentro de una misma request.
const obtenerConfig = cache(async () => {
  const filas = await db.select().from(config).where(eq(config.id, 1)).limit(1);
  return (
    filas[0] ?? {
      id: 1,
      saldoInicialCop: "0",
      saldoInicialFecha: null,
      umbralAlertaCop: "0",
      monedaPorDefecto: "COP" as const,
      tasaCambioSugerida: null,
      requerirComprobante: false,
      requerirClienteIngresos: false,
      diasAlertaInactividad: 0,
      zonaHoraria: "America/Bogota",
    }
  );
});

/** Suma de monto_cop por tipo en un rango (inclusive). */
async function sumarPorTipo(rango?: RangoFechas) {
  const condiciones = [soloActivas];
  if (rango) {
    condiciones.push(gte(transacciones.fecha, rango.desde));
    condiciones.push(lte(transacciones.fecha, rango.hasta));
  }
  const filas = await db
    .select({
      tipo: transacciones.tipo,
      total: sql<string>`coalesce(sum(${transacciones.montoCop}), 0)`,
    })
    .from(transacciones)
    .where(and(...condiciones))
    .groupBy(transacciones.tipo);

  const out = { ingreso: 0, egreso: 0 };
  for (const f of filas) {
    out[f.tipo] = Number(f.total);
  }
  return out;
}

/** Saldo actual = saldo inicial + ingresos - egresos (histórico completo). */
export async function obtenerSaldoActual(): Promise<number> {
  const cfg = await obtenerConfig();
  const totales = await sumarPorTipo();
  return Number(cfg.saldoInicialCop) + totales.ingreso - totales.egreso;
}

export interface ResumenDashboard {
  saldoActual: number;
  umbralAlerta: number;
  alertaCajaBaja: boolean;
  ingresosMes: number;
  egresosMes: number;
  ingresosMesAnterior: number;
  egresosMesAnterior: number;
  desgloseEgresos: { grupo: string; total: number }[];
  topClientes: { clienteId: string; nombre: string; total: number }[];
  utilidadMes: number;
}

export async function obtenerResumenDashboard(): Promise<ResumenDashboard> {
  const cfg = await obtenerConfig();
  const mesActual = rangoMesActual();
  const mesAnterior = rangoMesAnterior();

  const [saldoActual, actual, anterior, desglose, top] = await Promise.all([
    obtenerSaldoActual(),
    sumarPorTipo(mesActual),
    sumarPorTipo(mesAnterior),
    // Desglose de egresos del mes por grupo de gasto.
    db
      .select({
        grupo: categorias.grupoGasto,
        total: sql<string>`coalesce(sum(${transacciones.montoCop}), 0)`,
      })
      .from(transacciones)
      .innerJoin(categorias, eq(transacciones.categoriaId, categorias.id))
      .where(
        and(
          soloActivas,
          eq(transacciones.tipo, "egreso"),
          gte(transacciones.fecha, mesActual.desde),
          lte(transacciones.fecha, mesActual.hasta),
        ),
      )
      .groupBy(categorias.grupoGasto),
    // Top clientes por ingreso del mes.
    db
      .select({
        clienteId: transacciones.clienteId,
        nombre: clientes.nombre,
        total: sql<string>`coalesce(sum(${transacciones.montoCop}), 0)`,
      })
      .from(transacciones)
      .innerJoin(clientes, eq(transacciones.clienteId, clientes.id))
      .where(
        and(
          soloActivas,
          eq(transacciones.tipo, "ingreso"),
          gte(transacciones.fecha, mesActual.desde),
          lte(transacciones.fecha, mesActual.hasta),
        ),
      )
      .groupBy(transacciones.clienteId, clientes.nombre)
      .orderBy(desc(sql`sum(${transacciones.montoCop})`))
      .limit(5),
  ]);

  const umbral = Number(cfg.umbralAlertaCop);
  return {
    saldoActual,
    umbralAlerta: umbral,
    alertaCajaBaja: umbral > 0 && saldoActual < umbral,
    ingresosMes: actual.ingreso,
    egresosMes: actual.egreso,
    ingresosMesAnterior: anterior.ingreso,
    egresosMesAnterior: anterior.egreso,
    utilidadMes: actual.ingreso - actual.egreso,
    desgloseEgresos: desglose.map((d) => ({ grupo: d.grupo, total: Number(d.total) })),
    topClientes: top.map((t) => ({
      clienteId: t.clienteId ?? "",
      nombre: t.nombre,
      total: Number(t.total),
    })),
  };
}

/** Últimas N transacciones activas, con nombres de categoría y cliente. */
export async function obtenerUltimasTransacciones(limite = 10) {
  return listarTransacciones({ limite });
}

export interface FiltrosTransaccion {
  tipo?: "ingreso" | "egreso";
  categoriaId?: string;
  clienteId?: string;
  desde?: string;
  hasta?: string;
  creadoPor?: string;
  limite?: number;
}

export async function listarTransacciones(filtros: FiltrosTransaccion = {}) {
  const condiciones = [soloActivas];
  if (filtros.tipo) condiciones.push(eq(transacciones.tipo, filtros.tipo));
  if (filtros.categoriaId)
    condiciones.push(eq(transacciones.categoriaId, filtros.categoriaId));
  if (filtros.clienteId)
    condiciones.push(eq(transacciones.clienteId, filtros.clienteId));
  if (filtros.creadoPor)
    condiciones.push(eq(transacciones.creadoPor, filtros.creadoPor));
  if (filtros.desde) condiciones.push(gte(transacciones.fecha, filtros.desde));
  if (filtros.hasta) condiciones.push(lte(transacciones.fecha, filtros.hasta));

  const q = db
    .select({
      id: transacciones.id,
      tipo: transacciones.tipo,
      moneda: transacciones.moneda,
      montoOriginal: transacciones.montoOriginal,
      tasaCambio: transacciones.tasaCambio,
      montoCop: transacciones.montoCop,
      fecha: transacciones.fecha,
      descripcion: transacciones.descripcion,
      metodoPago: transacciones.metodoPago,
      comprobanteUrl: transacciones.comprobanteUrl,
      creadoPor: transacciones.creadoPor,
      categoriaId: transacciones.categoriaId,
      categoriaNombre: categorias.nombre,
      clienteId: transacciones.clienteId,
      clienteNombre: clientes.nombre,
    })
    .from(transacciones)
    .innerJoin(categorias, eq(transacciones.categoriaId, categorias.id))
    .leftJoin(clientes, eq(transacciones.clienteId, clientes.id))
    .where(and(...condiciones))
    .orderBy(desc(transacciones.fecha), desc(transacciones.createdAt));

  if (filtros.limite) return q.limit(filtros.limite);
  return q;
}

export async function listarCategorias() {
  return db
    .select()
    .from(categorias)
    .where(eq(categorias.activa, true))
    .orderBy(categorias.tipo, categorias.nombre);
}

export async function listarClientes() {
  return db.select().from(clientes).orderBy(clientes.nombre);
}

/** Detalle de un cliente con totales de caja (no contables). */
export async function obtenerDetalleCliente(clienteId: string) {
  const [cliente] = await db
    .select()
    .from(clientes)
    .where(eq(clientes.id, clienteId))
    .limit(1);
  if (!cliente) return null;

  const totales = await db
    .select({
      tipo: transacciones.tipo,
      total: sql<string>`coalesce(sum(${transacciones.montoCop}), 0)`,
    })
    .from(transacciones)
    .where(and(soloActivas, eq(transacciones.clienteId, clienteId)))
    .groupBy(transacciones.tipo);

  let ingresado = 0;
  let gastado = 0;
  for (const t of totales) {
    if (t.tipo === "ingreso") ingresado = Number(t.total);
    else gastado = Number(t.total);
  }

  const movimientos = await listarTransacciones({ clienteId });
  return {
    cliente,
    ingresado,
    gastado,
    rentabilidadCaja: ingresado - gastado,
    movimientos,
  };
}

export { obtenerConfig };
