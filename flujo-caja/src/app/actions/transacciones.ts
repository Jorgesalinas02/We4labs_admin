"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { transacciones, config, categorias } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { requireAdmin, RespuestaError } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit";
import { transaccionSchema } from "@/lib/validations";
import { calcularMontoCop } from "@/lib/money";

// Reglas de captura: comprobante (config) + cliente según la categoría (pideCliente).
async function validarReglasCaptura(d: {
  tipo: string;
  categoriaId: string;
  clienteId?: string | null;
  comprobanteUrl?: string | null;
}): Promise<string | null> {
  const [cfg] = await db.select().from(config).where(eq(config.id, 1)).limit(1);
  if (cfg?.requerirComprobante && !d.comprobanteUrl) {
    return "La configuración exige adjuntar un comprobante.";
  }
  const [cat] = await db
    .select({ pideCliente: categorias.pideCliente })
    .from(categorias)
    .where(eq(categorias.id, d.categoriaId))
    .limit(1);
  if (cat?.pideCliente === "si" && !d.clienteId) {
    return "Esta categoría exige asociar un cliente.";
  }
  return null;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

function leerFormData(formData: FormData) {
  const clienteIdRaw = formData.get("clienteId");
  const comprobanteUrl = formData.get("comprobanteUrl");
  const comprobantePathname = formData.get("comprobantePathname");
  return {
    tipo: formData.get("tipo"),
    categoriaId: formData.get("categoriaId"),
    clienteId: clienteIdRaw ? String(clienteIdRaw) : null,
    moneda: formData.get("moneda"),
    montoOriginal: formData.get("montoOriginal"),
    tasaCambio: formData.get("tasaCambio") || 1,
    fecha: formData.get("fecha"),
    descripcion: formData.get("descripcion"),
    metodoPago: formData.get("metodoPago") || null,
    comprobanteUrl: comprobanteUrl ? String(comprobanteUrl) : null,
    comprobantePathname: comprobantePathname ? String(comprobantePathname) : null,
    esRecurrente: formData.get("esRecurrente") === "on",
    frecuencia: formData.get("frecuencia") || null,
    esProyectada: formData.get("esProyectada") === "on",
  };
}

export async function crearTransaccion(formData: FormData): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const parsed = transaccionSchema.safeParse(leerFormData(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const d = parsed.data;

    const errorReglas = await validarReglasCaptura(d);
    if (errorReglas) return { ok: false, error: errorReglas };

    const montoCop = calcularMontoCop(d.montoOriginal, d.moneda, d.tasaCambio);

    const [creada] = await db
      .insert(transacciones)
      .values({
        tipo: d.tipo,
        categoriaId: d.categoriaId,
        clienteId: d.clienteId || null,
        moneda: d.moneda,
        montoOriginal: d.montoOriginal.toFixed(2),
        tasaCambio: d.tasaCambio.toFixed(4),
        montoCop: montoCop.toFixed(2),
        fecha: d.fecha,
        descripcion: d.descripcion,
        metodoPago: d.metodoPago || null,
        comprobanteUrl: d.comprobanteUrl || null,
        comprobantePathname: d.comprobantePathname || null,
        esRecurrente: d.esRecurrente,
        frecuencia: d.esRecurrente ? d.frecuencia : null,
        esProyectada: d.esProyectada,
        creadoPor: usuario.clerkId,
      })
      .returning({ id: transacciones.id });

    await registrarAuditoria({
      usuario,
      accion: "crear",
      entidad: "transaccion",
      entidadId: creada.id,
      valoresDespues: d,
    });

    revalidatePath("/");
    revalidatePath("/transacciones");
    revalidatePath("/proyeccion");
    return { ok: true, id: creada.id };
  } catch (e) {
    return manejarError(e);
  }
}

export async function editarTransaccion(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const parsed = transaccionSchema.safeParse(leerFormData(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const d = parsed.data;

    const [antes] = await db
      .select()
      .from(transacciones)
      .where(eq(transacciones.id, id))
      .limit(1);
    if (!antes || antes.estado === "eliminada") {
      return { ok: false, error: "Transacción no encontrada" };
    }

    const errorReglas = await validarReglasCaptura(d);
    if (errorReglas) return { ok: false, error: errorReglas };

    const montoCop = calcularMontoCop(d.montoOriginal, d.moneda, d.tasaCambio);
    await db
      .update(transacciones)
      .set({
        tipo: d.tipo,
        categoriaId: d.categoriaId,
        clienteId: d.clienteId || null,
        moneda: d.moneda,
        montoOriginal: d.montoOriginal.toFixed(2),
        tasaCambio: d.tasaCambio.toFixed(4),
        montoCop: montoCop.toFixed(2),
        fecha: d.fecha,
        descripcion: d.descripcion,
        metodoPago: d.metodoPago || null,
        comprobanteUrl: d.comprobanteUrl || null,
        comprobantePathname: d.comprobantePathname || null,
        esRecurrente: d.esRecurrente,
        frecuencia: d.esRecurrente ? d.frecuencia : null,
        esProyectada: d.esProyectada,
      })
      .where(eq(transacciones.id, id));

    await registrarAuditoria({
      usuario,
      accion: "editar",
      entidad: "transaccion",
      entidadId: id,
      valoresAntes: antes,
      valoresDespues: d,
    });

    revalidatePath("/");
    revalidatePath("/transacciones");
    revalidatePath("/proyeccion");
    return { ok: true, id };
  } catch (e) {
    return manejarError(e);
  }
}

/**
 * Crea una fila "esperada" (proyectada) para el Flujo de Caja Proyectado.
 * No es una transacción real: no afecta el saldo, solo la proyección.
 */
export async function crearEsperada(formData: FormData): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const tipo = formData.get("tipo");
    const monto = Number(formData.get("montoCop"));
    const fecha = String(formData.get("fecha") ?? "");
    const descripcion = String(formData.get("descripcion") ?? "").trim();
    if (tipo !== "ingreso" && tipo !== "egreso") {
      return { ok: false, error: "Tipo inválido" };
    }
    if (!monto || monto <= 0) return { ok: false, error: "Monto inválido" };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "Fecha inválida" };
    if (!descripcion) return { ok: false, error: "Agrega una descripción" };

    // Categoría comodín: usa cualquier subcategoría del tipo para satisfacer el FK.
    const [cat] = await db
      .select({ id: categorias.id })
      .from(categorias)
      .where(and(eq(categorias.tipo, tipo), isNotNull(categorias.categoriaMadreId)))
      .limit(1);
    if (!cat) return { ok: false, error: "No hay categorías; ejecuta el seed." };

    const [creada] = await db
      .insert(transacciones)
      .values({
        tipo,
        categoriaId: cat.id,
        moneda: "COP",
        montoOriginal: monto.toFixed(2),
        tasaCambio: "1",
        montoCop: monto.toFixed(2),
        fecha,
        descripcion,
        esProyectada: true,
        creadoPor: usuario.clerkId,
      })
      .returning({ id: transacciones.id });

    await registrarAuditoria({
      usuario,
      accion: "crear",
      entidad: "esperada",
      entidadId: creada.id,
      detalle: `Fila esperada: ${descripcion}`,
    });
    revalidatePath("/proyeccion");
    return { ok: true, id: creada.id };
  } catch (e) {
    return manejarError(e);
  }
}

/** Soft delete: marca como eliminada, nunca borra físicamente. */
export async function eliminarTransaccion(id: string): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const [antes] = await db
      .select()
      .from(transacciones)
      .where(eq(transacciones.id, id))
      .limit(1);
    if (!antes || antes.estado === "eliminada") {
      return { ok: false, error: "Transacción no encontrada" };
    }

    await db
      .update(transacciones)
      .set({ estado: "eliminada" })
      .where(eq(transacciones.id, id));

    await registrarAuditoria({
      usuario,
      accion: "eliminar",
      entidad: "transaccion",
      entidadId: id,
      valoresAntes: antes,
    });

    revalidatePath("/");
    revalidatePath("/transacciones");
    revalidatePath("/proyeccion");
    return { ok: true, id };
  } catch (e) {
    return manejarError(e);
  }
}

function manejarError(e: unknown): ActionResult {
  if (e instanceof RespuestaError) {
    return { ok: false, error: e.message };
  }
  console.error(e);
  return { ok: false, error: "Ocurrió un error inesperado" };
}
