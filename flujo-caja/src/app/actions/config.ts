"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { config } from "@/db/schema";
import { requireAdmin, RespuestaError } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit";
import { configSchema } from "@/lib/validations";
import type { ActionResult } from "./transacciones";

export async function guardarConfig(formData: FormData): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const parsed = configSchema.safeParse({
      saldoInicialCop: formData.get("saldoInicialCop"),
      saldoInicialFecha: formData.get("saldoInicialFecha") || null,
      umbralAlertaCop: formData.get("umbralAlertaCop") || 0,
      monedaPorDefecto: formData.get("monedaPorDefecto") || "COP",
      tasaCambioSugerida: formData.get("tasaCambioSugerida") || null,
      requerirComprobante: formData.get("requerirComprobante") === "on",
      requerirClienteIngresos: formData.get("requerirClienteIngresos") === "on",
      diasAlertaInactividad: formData.get("diasAlertaInactividad") || 0,
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const d = parsed.data;

    const valores = {
      saldoInicialCop: d.saldoInicialCop.toFixed(2),
      saldoInicialFecha: d.saldoInicialFecha || null,
      umbralAlertaCop: d.umbralAlertaCop.toFixed(2),
      monedaPorDefecto: d.monedaPorDefecto,
      tasaCambioSugerida:
        d.tasaCambioSugerida != null ? d.tasaCambioSugerida.toFixed(4) : null,
      requerirComprobante: d.requerirComprobante,
      requerirClienteIngresos: d.requerirClienteIngresos,
      diasAlertaInactividad: d.diasAlertaInactividad,
    };

    await db
      .insert(config)
      .values({ id: 1, ...valores })
      .onConflictDoUpdate({ target: config.id, set: valores });

    await registrarAuditoria({
      usuario,
      accion: "editar",
      entidad: "config",
      entidadId: "1",
      valoresDespues: d,
    });
    revalidatePath("/");
    revalidatePath("/configuracion");
    return { ok: true };
  } catch (e) {
    if (e instanceof RespuestaError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Ocurrió un error inesperado" };
  }
}
