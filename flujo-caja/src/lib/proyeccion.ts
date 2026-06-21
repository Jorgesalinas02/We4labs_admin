import { db } from "@/db";
import { transacciones } from "@/db/schema";
import { and, eq, lt, gte, lte, sql } from "drizzle-orm";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  addDays,
  addMonths,
  format,
  parseISO,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { ZONA_HORARIA } from "./dates";
import { obtenerConfig, estadoCaja, type EstadoCaja } from "./queries";

export interface SemanaProyectada {
  inicio: string; // YYYY-MM-DD
  fin: string;
  etiqueta: string; // "30 jun"
  saldoInicial: number;
  entradasReales: number;
  salidasReales: number;
  entradasEsperadas: number;
  salidasEsperadas: number;
  saldoFinalReal: number; // solo con lo real
  saldoFinalProyectado: number; // real + esperado
  estado: EstadoCaja;
}

export interface Proyeccion {
  cajaMinima: number;
  semanas: SemanaProyectada[];
}

function iso(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

const opts = { weekStartsOn: 1 as const }; // lunes

/** Construye la proyección de flujo de caja a N semanas. */
export async function construirProyeccion(): Promise<Proyeccion> {
  const cfg = await obtenerConfig();
  const horizonte = cfg.horizonteProyeccionSemanas || 8;
  const cajaMinima = Number(cfg.cajaMinimaCop);

  const hoy = toZonedTime(new Date(), ZONA_HORARIA);
  const week0 = startOfWeek(hoy, opts);
  const finHorizonte = endOfWeek(addWeeks(week0, horizonte - 1), opts);
  const week0Iso = iso(week0);
  const finIso = iso(finHorizonte);

  // Saldo base = saldo inicial + neto real de todo lo anterior a la semana 0.
  const [antes] = await db
    .select({
      total: sql<string>`coalesce(sum(case when ${transacciones.tipo} = 'ingreso' then ${transacciones.montoCop} else -${transacciones.montoCop} end), 0)`,
    })
    .from(transacciones)
    .where(
      and(
        eq(transacciones.estado, "activa"),
        eq(transacciones.esProyectada, false),
        lt(transacciones.fecha, week0Iso),
      ),
    );
  const saldoBase = Number(cfg.saldoInicialCop) + Number(antes.total);

  // Movimientos dentro del horizonte: reales (no recurrentes-generados) + esperados.
  const dentro = await db
    .select({
      tipo: transacciones.tipo,
      montoCop: transacciones.montoCop,
      fecha: transacciones.fecha,
      esProyectada: transacciones.esProyectada,
    })
    .from(transacciones)
    .where(
      and(
        eq(transacciones.estado, "activa"),
        gte(transacciones.fecha, week0Iso),
        lte(transacciones.fecha, finIso),
      ),
    );

  // Recurrentes (reales): generamos ocurrencias futuras dentro del horizonte.
  const recurrentes = await db
    .select({
      tipo: transacciones.tipo,
      montoCop: transacciones.montoCop,
      fecha: transacciones.fecha,
      frecuencia: transacciones.frecuencia,
    })
    .from(transacciones)
    .where(
      and(
        eq(transacciones.estado, "activa"),
        eq(transacciones.esProyectada, false),
        eq(transacciones.esRecurrente, true),
      ),
    );

  interface Mov {
    tipo: "ingreso" | "egreso";
    monto: number;
    fecha: Date;
    real: boolean;
  }
  const movimientos: Mov[] = [];

  for (const m of dentro) {
    movimientos.push({
      tipo: m.tipo,
      monto: Number(m.montoCop),
      fecha: parseISO(m.fecha),
      real: !m.esProyectada,
    });
  }

  // Generar ocurrencias recurrentes futuras (estrictamente después del original).
  for (const r of recurrentes) {
    if (!r.frecuencia) continue;
    let cursor = avanzar(parseISO(r.fecha), r.frecuencia);
    while (cursor <= finHorizonte) {
      if (cursor >= week0) {
        movimientos.push({
          tipo: r.tipo,
          monto: Number(r.montoCop),
          fecha: cursor,
          real: false, // ocurrencia proyectada
        });
      }
      cursor = avanzar(cursor, r.frecuencia);
    }
  }

  // Armar semanas.
  const semanas: SemanaProyectada[] = [];
  let saldoInicial = saldoBase;
  for (let i = 0; i < horizonte; i++) {
    const inicio = startOfWeek(addWeeks(week0, i), opts);
    const fin = endOfWeek(inicio, opts);
    const enRango = movimientos.filter((m) => m.fecha >= inicio && m.fecha <= fin);

    let entradasReales = 0,
      salidasReales = 0,
      entradasEsp = 0,
      salidasEsp = 0;
    for (const m of enRango) {
      if (m.tipo === "ingreso") {
        if (m.real) entradasReales += m.monto;
        else entradasEsp += m.monto;
      } else {
        if (m.real) salidasReales += m.monto;
        else salidasEsp += m.monto;
      }
    }

    const saldoFinalReal = saldoInicial + entradasReales - salidasReales;
    const saldoFinalProyectado =
      saldoInicial + entradasReales + entradasEsp - salidasReales - salidasEsp;

    semanas.push({
      inicio: iso(inicio),
      fin: iso(fin),
      etiqueta: format(inicio, "d MMM", { locale: es }),
      saldoInicial,
      entradasReales,
      salidasReales,
      entradasEsperadas: entradasEsp,
      salidasEsperadas: salidasEsp,
      saldoFinalReal,
      saldoFinalProyectado,
      estado: estadoCaja(saldoFinalProyectado, cajaMinima),
    });
    saldoInicial = saldoFinalProyectado; // la proyección arrastra el saldo completo
  }

  return { cajaMinima, semanas };
}

function avanzar(d: Date, frecuencia: "mensual" | "quincenal" | "semanal"): Date {
  if (frecuencia === "semanal") return addDays(d, 7);
  if (frecuencia === "quincenal") return addDays(d, 14);
  return addMonths(d, 1);
}
