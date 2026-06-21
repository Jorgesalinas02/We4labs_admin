"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { obligacionesTributarias, categorias, transacciones } from "@/db/schema";
import { eq, and, isNull, ilike } from "drizzle-orm";
import { addMonths, addYears, parseISO, format } from "date-fns";
import { requireAdmin, RespuestaError } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit";
import { obligacionSchema } from "@/lib/validations";
import { hoyISO } from "@/lib/dates";
import type { ActionResult } from "./transacciones";

function leer(formData: FormData) {
  return {
    nombre: formData.get("nombre"),
    periodicidad: formData.get("periodicidad"),
    proximoVencimiento: formData.get("proximoVencimiento") || null,
    diasAnticipacion: formData.get("diasAnticipacion") || 5,
    montoEstimadoCop: formData.get("montoEstimadoCop") || null,
    nota: formData.get("nota") || null,
  };
}

export async function crearObligacion(formData: FormData): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const parsed = obligacionSchema.safeParse(leer(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const d = parsed.data;
    const [creada] = await db
      .insert(obligacionesTributarias)
      .values({
        nombre: d.nombre,
        periodicidad: d.periodicidad,
        proximoVencimiento: d.proximoVencimiento || null,
        diasAnticipacion: d.diasAnticipacion,
        montoEstimadoCop:
          d.montoEstimadoCop != null ? d.montoEstimadoCop.toFixed(2) : null,
        nota: d.nota || null,
      })
      .returning({ id: obligacionesTributarias.id });

    await registrarAuditoria({
      usuario,
      accion: "crear",
      entidad: "obligacion",
      entidadId: creada.id,
      valoresDespues: d,
    });
    revalidatePath("/configuracion");
    revalidatePath("/");
    return { ok: true, id: creada.id };
  } catch (e) {
    return err(e);
  }
}

export async function editarObligacion(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const parsed = obligacionSchema.safeParse(leer(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const d = parsed.data;
    await db
      .update(obligacionesTributarias)
      .set({
        nombre: d.nombre,
        periodicidad: d.periodicidad,
        proximoVencimiento: d.proximoVencimiento || null,
        diasAnticipacion: d.diasAnticipacion,
        montoEstimadoCop:
          d.montoEstimadoCop != null ? d.montoEstimadoCop.toFixed(2) : null,
        nota: d.nota || null,
      })
      .where(eq(obligacionesTributarias.id, id));

    await registrarAuditoria({
      usuario,
      accion: "editar",
      entidad: "obligacion",
      entidadId: id,
      valoresDespues: d,
    });
    revalidatePath("/configuracion");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e) {
    return err(e);
  }
}

export async function eliminarObligacion(id: string): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    await db
      .update(obligacionesTributarias)
      .set({ activa: false })
      .where(eq(obligacionesTributarias.id, id));
    await registrarAuditoria({
      usuario,
      accion: "eliminar",
      entidad: "obligacion",
      entidadId: id,
    });
    revalidatePath("/configuracion");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return err(e);
  }
}

/**
 * Marca una obligación como pagada: crea el egreso correspondiente
 * (categoría "Impuestos y obligaciones") y rueda la fecha al siguiente periodo.
 */
export async function marcarPagada(
  id: string,
  montoPagado?: number,
): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const [obl] = await db
      .select()
      .from(obligacionesTributarias)
      .where(eq(obligacionesTributarias.id, id))
      .limit(1);
    if (!obl) return { ok: false, error: "Obligación no encontrada" };

    const monto = montoPagado ?? Number(obl.montoEstimadoCop ?? 0);
    if (!monto || monto <= 0) {
      return { ok: false, error: "Define un monto estimado para registrar el pago." };
    }

    // Subcategoría dentro de "Impuestos y obligaciones": coincide por nombre o cae en "Otras tasas".
    const sub = await buscarSubImpuesto(obl.nombre);
    if (!sub) {
      return {
        ok: false,
        error: "No se encontró la categoría de Impuestos. Reseed de categorías requerido.",
      };
    }

    const [tx] = await db
      .insert(transacciones)
      .values({
        tipo: "egreso",
        categoriaId: sub,
        moneda: "COP",
        montoOriginal: monto.toFixed(2),
        tasaCambio: "1",
        montoCop: monto.toFixed(2),
        fecha: hoyISO(),
        descripcion: `Pago obligación: ${obl.nombre}`,
        creadoPor: usuario.clerkId,
      })
      .returning({ id: transacciones.id });

    // Rueda la fecha al siguiente periodo y deja pendiente para el próximo ciclo.
    const siguiente = siguienteVencimiento(obl.proximoVencimiento, obl.periodicidad);
    await db
      .update(obligacionesTributarias)
      .set({ transaccionId: tx.id, proximoVencimiento: siguiente, estado: "pendiente" })
      .where(eq(obligacionesTributarias.id, id));

    await registrarAuditoria({
      usuario,
      accion: "crear",
      entidad: "transaccion",
      entidadId: tx.id,
      detalle: `Pago de obligación tributaria: ${obl.nombre}`,
    });

    revalidatePath("/");
    revalidatePath("/transacciones");
    revalidatePath("/configuracion");
    revalidatePath("/proyeccion");
    return { ok: true, id: tx.id };
  } catch (e) {
    return err(e);
  }
}

async function buscarSubImpuesto(nombreObligacion: string): Promise<string | null> {
  // Madre "Impuestos y obligaciones".
  const [madre] = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(and(isNull(categorias.categoriaMadreId), ilike(categorias.nombre, "Impuestos%")))
    .limit(1);
  if (!madre) return null;

  const subs = await db
    .select({ id: categorias.id, nombre: categorias.nombre })
    .from(categorias)
    .where(eq(categorias.categoriaMadreId, madre.id));

  const objetivo = nombreObligacion.toLowerCase();
  const match =
    subs.find((s) => objetivo.includes(s.nombre.toLowerCase().split(" ")[0])) ??
    subs.find((s) => s.nombre.toLowerCase().startsWith("otras")) ??
    subs[0];
  return match?.id ?? null;
}

function siguienteVencimiento(
  fecha: string | null,
  periodicidad: string,
): string | null {
  if (!fecha) return null;
  const base = parseISO(fecha);
  const paso: Record<string, Date> = {
    mensual: addMonths(base, 1),
    bimestral: addMonths(base, 2),
    cuatrimestral: addMonths(base, 4),
    anual: addYears(base, 1),
  };
  const next = paso[periodicidad];
  return next ? format(next, "yyyy-MM-dd") : null;
}

function err(e: unknown): ActionResult {
  if (e instanceof RespuestaError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Ocurrió un error inesperado" };
}
