import { db } from "@/db";
import {
  transacciones,
  categorias,
  clientes,
  config,
  obligacionesTributarias,
} from "@/db/schema";
import { and, eq, gte, lte, sql, desc, asc, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cache } from "react";
import { startOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import {
  rangoMesActual,
  rangoMesAnterior,
  ZONA_HORARIA,
  type RangoFechas,
} from "./dates";

// Solo transacciones reales (no proyectadas) y activas.
const soloReales = and(
  eq(transacciones.estado, "activa"),
  eq(transacciones.esProyectada, false),
);

// cache() dedupe la lectura de config dentro de una misma request.
const obtenerConfig = cache(async () => {
  const filas = await db.select().from(config).where(eq(config.id, 1)).limit(1);
  return (
    filas[0] ?? {
      id: 1,
      saldoInicialCop: "0",
      saldoInicialFecha: null,
      cajaMinimaCop: "0",
      horizonteProyeccionSemanas: 8,
      monedaPorDefecto: "COP" as const,
      tasaCambioSugerida: null,
      requerirComprobante: false,
      requerirClienteIngresos: false,
      diasAlertaInactividad: 0,
      zonaHoraria: "America/Bogota",
    }
  );
});

async function sumarPorTipo(rango?: RangoFechas) {
  const condiciones = [soloReales];
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
  for (const f of filas) out[f.tipo] = Number(f.total);
  return out;
}

/** Saldo actual = saldo inicial + ingresos - egresos (histórico real). */
export async function obtenerSaldoActual(): Promise<number> {
  const cfg = await obtenerConfig();
  const totales = await sumarPorTipo();
  return Number(cfg.saldoInicialCop) + totales.ingreso - totales.egreso;
}

export type EstadoCaja = "comodo" | "cerca" | "bajo";

/** Semáforo de caja según la caja mínima configurada. */
export function estadoCaja(saldo: number, cajaMinima: number): EstadoCaja {
  if (cajaMinima <= 0) return "comodo";
  if (saldo < cajaMinima) return "bajo";
  if (saldo < cajaMinima * 1.2) return "cerca"; // dentro del 20% sobre el mínimo
  return "comodo";
}

export interface ResumenDashboard {
  saldoActual: number;
  cajaMinima: number;
  estado: EstadoCaja;
  ingresosMes: number;
  egresosMes: number;
  ingresosMesAnterior: number;
  egresosMesAnterior: number;
  desgloseEgresos: { madre: string; total: number }[];
  topClientes: { clienteId: string; nombre: string; total: number }[];
  utilidadMes: number;
  obligacionesProximas: ObligacionProxima[];
}

export interface ObligacionProxima {
  id: string;
  nombre: string;
  proximoVencimiento: string | null;
  montoEstimadoCop: string | null;
  diasRestantes: number | null;
}

export async function obtenerResumenDashboard(): Promise<ResumenDashboard> {
  const cfg = await obtenerConfig();
  const mesActual = rangoMesActual();
  const mesAnterior = rangoMesAnterior();
  const madre = alias(categorias, "madre");

  const [saldoActual, actual, anterior, desglose, top, obligaciones] =
    await Promise.all([
      obtenerSaldoActual(),
      sumarPorTipo(mesActual),
      sumarPorTipo(mesAnterior),
      // Desglose de egresos del mes por Categoría madre.
      db
        .select({
          madre: madre.nombre,
          total: sql<string>`coalesce(sum(${transacciones.montoCop}), 0)`,
        })
        .from(transacciones)
        .innerJoin(categorias, eq(transacciones.categoriaId, categorias.id))
        .innerJoin(madre, eq(categorias.categoriaMadreId, madre.id))
        .where(
          and(
            soloReales,
            eq(transacciones.tipo, "egreso"),
            gte(transacciones.fecha, mesActual.desde),
            lte(transacciones.fecha, mesActual.hasta),
          ),
        )
        .groupBy(madre.nombre),
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
            soloReales,
            eq(transacciones.tipo, "ingreso"),
            gte(transacciones.fecha, mesActual.desde),
            lte(transacciones.fecha, mesActual.hasta),
          ),
        )
        .groupBy(transacciones.clienteId, clientes.nombre)
        .orderBy(desc(sql`sum(${transacciones.montoCop})`))
        .limit(5),
      obtenerObligacionesProximas(),
    ]);

  const cajaMinima = Number(cfg.cajaMinimaCop);
  return {
    saldoActual,
    cajaMinima,
    estado: estadoCaja(saldoActual, cajaMinima),
    ingresosMes: actual.ingreso,
    egresosMes: actual.egreso,
    ingresosMesAnterior: anterior.ingreso,
    egresosMesAnterior: anterior.egreso,
    utilidadMes: actual.ingreso - actual.egreso,
    desgloseEgresos: desglose.map((d) => ({ madre: d.madre, total: Number(d.total) })),
    topClientes: top.map((t) => ({
      clienteId: t.clienteId ?? "",
      nombre: t.nombre,
      total: Number(t.total),
    })),
    obligacionesProximas: obligaciones,
  };
}

export async function obtenerUltimasTransacciones(limite = 10) {
  return listarTransacciones({ limite });
}

export interface FiltrosTransaccion {
  tipo?: "ingreso" | "egreso";
  categoriaId?: string;
  madreId?: string;
  clienteId?: string;
  desde?: string;
  hasta?: string;
  creadoPor?: string;
  limite?: number;
}

export async function listarTransacciones(filtros: FiltrosTransaccion = {}) {
  const madre = alias(categorias, "madre");
  const condiciones = [soloReales];
  if (filtros.tipo) condiciones.push(eq(transacciones.tipo, filtros.tipo));
  if (filtros.categoriaId)
    condiciones.push(eq(transacciones.categoriaId, filtros.categoriaId));
  if (filtros.madreId)
    condiciones.push(eq(categorias.categoriaMadreId, filtros.madreId));
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
      esRecurrente: transacciones.esRecurrente,
      frecuencia: transacciones.frecuencia,
      creadoPor: transacciones.creadoPor,
      categoriaId: transacciones.categoriaId,
      categoriaNombre: categorias.nombre,
      madreNombre: madre.nombre,
      clienteId: transacciones.clienteId,
      clienteNombre: clientes.nombre,
    })
    .from(transacciones)
    .innerJoin(categorias, eq(transacciones.categoriaId, categorias.id))
    .leftJoin(madre, eq(categorias.categoriaMadreId, madre.id))
    .leftJoin(clientes, eq(transacciones.clienteId, clientes.id))
    .where(and(...condiciones))
    .orderBy(desc(transacciones.fecha), desc(transacciones.createdAt));

  if (filtros.limite) return q.limit(filtros.limite);
  return q;
}

/** Árbol de categorías activas: madres con sus subcategorías. */
export async function listarCategoriasArbol() {
  const todas = await db
    .select()
    .from(categorias)
    .where(eq(categorias.activa, true))
    .orderBy(asc(categorias.orden), asc(categorias.nombre));
  const madres = todas.filter((c) => c.categoriaMadreId === null);
  return madres.map((m) => ({
    ...m,
    subs: todas.filter((s) => s.categoriaMadreId === m.id),
  }));
}

/** Solo las categorías madre (para filtros). */
export async function listarMadres() {
  return db
    .select()
    .from(categorias)
    .where(and(eq(categorias.activa, true), isNull(categorias.categoriaMadreId)))
    .orderBy(asc(categorias.orden));
}

export async function listarClientes() {
  return db.select().from(clientes).orderBy(clientes.nombre);
}

/** Detalle de un cliente: rentabilidad = ingresos - costos directos. */
export async function obtenerDetalleCliente(clienteId: string) {
  const [cliente] = await db
    .select()
    .from(clientes)
    .where(eq(clientes.id, clienteId))
    .limit(1);
  if (!cliente) return null;

  // Ingresos del cliente.
  const [ing] = await db
    .select({ total: sql<string>`coalesce(sum(${transacciones.montoCop}), 0)` })
    .from(transacciones)
    .where(
      and(soloReales, eq(transacciones.clienteId, clienteId), eq(transacciones.tipo, "ingreso")),
    );

  // Costos directos del cliente (egresos cuya categoría es costo directo).
  const [cd] = await db
    .select({ total: sql<string>`coalesce(sum(${transacciones.montoCop}), 0)` })
    .from(transacciones)
    .innerJoin(categorias, eq(transacciones.categoriaId, categorias.id))
    .where(
      and(
        soloReales,
        eq(transacciones.clienteId, clienteId),
        eq(transacciones.tipo, "egreso"),
        eq(categorias.esCostoDirecto, true),
      ),
    );

  // Otros egresos del cliente (no costo directo).
  const [otros] = await db
    .select({ total: sql<string>`coalesce(sum(${transacciones.montoCop}), 0)` })
    .from(transacciones)
    .innerJoin(categorias, eq(transacciones.categoriaId, categorias.id))
    .where(
      and(
        soloReales,
        eq(transacciones.clienteId, clienteId),
        eq(transacciones.tipo, "egreso"),
        eq(categorias.esCostoDirecto, false),
      ),
    );

  const ingresado = Number(ing.total);
  const costosDirectos = Number(cd.total);
  const otrosGastos = Number(otros.total);
  const movimientos = await listarTransacciones({ clienteId });
  return {
    cliente,
    ingresado,
    costosDirectos,
    otrosGastos,
    rentabilidad: ingresado - costosDirectos,
    movimientos,
  };
}

/** Obligaciones tributarias próximas a vencer (o vencidas), ordenadas. */
export async function obtenerObligacionesProximas(): Promise<ObligacionProxima[]> {
  const filas = await db
    .select()
    .from(obligacionesTributarias)
    .where(
      and(
        eq(obligacionesTributarias.activa, true),
        eq(obligacionesTributarias.estado, "pendiente"),
      ),
    );

  const hoy = new Date();
  return filas
    .filter((o) => o.proximoVencimiento)
    .map((o) => {
      const venc = new Date(o.proximoVencimiento as string);
      const dias = Math.ceil((venc.getTime() - hoy.getTime()) / 86400000);
      return {
        id: o.id,
        nombre: o.nombre,
        proximoVencimiento: o.proximoVencimiento,
        montoEstimadoCop: o.montoEstimadoCop,
        diasRestantes: dias,
      };
    })
    .sort((a, b) => (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0))
    .slice(0, 5);
}

export async function listarObligaciones() {
  return db
    .select()
    .from(obligacionesTributarias)
    .orderBy(asc(obligacionesTributarias.proximoVencimiento));
}

export interface PuntoMensual {
  ym: string; // "2026-06"
  etiqueta: string; // "jun"
  ingresos: number;
  egresos: number;
}

/** Serie de ingresos/egresos de los últimos N meses (para el gráfico de barras). */
export async function serieMensual(meses = 6): Promise<PuntoMensual[]> {
  const ahora = toZonedTime(new Date(), ZONA_HORARIA);
  const primerMes = startOfMonth(subMonths(ahora, meses - 1));
  const desde = format(primerMes, "yyyy-MM-dd");

  const filas = await db
    .select({
      ym: sql<string>`to_char(${transacciones.fecha}, 'YYYY-MM')`,
      tipo: transacciones.tipo,
      total: sql<string>`coalesce(sum(${transacciones.montoCop}), 0)`,
    })
    .from(transacciones)
    .where(and(soloReales, gte(transacciones.fecha, desde)))
    .groupBy(sql`to_char(${transacciones.fecha}, 'YYYY-MM')`, transacciones.tipo);

  const mapa = new Map<string, { ingresos: number; egresos: number }>();
  for (const f of filas) {
    const e = mapa.get(f.ym) ?? { ingresos: 0, egresos: 0 };
    if (f.tipo === "ingreso") e.ingresos = Number(f.total);
    else e.egresos = Number(f.total);
    mapa.set(f.ym, e);
  }

  const out: PuntoMensual[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = subMonths(ahora, i);
    const ym = format(d, "yyyy-MM");
    const e = mapa.get(ym) ?? { ingresos: 0, egresos: 0 };
    out.push({
      ym,
      etiqueta: format(d, "LLL", { locale: es }),
      ingresos: e.ingresos,
      egresos: e.egresos,
    });
  }
  return out;
}

export { obtenerConfig };
