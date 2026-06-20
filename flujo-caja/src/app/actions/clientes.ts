"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { clientes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, RespuestaError } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit";
import { clienteSchema } from "@/lib/validations";
import type { ActionResult } from "./transacciones";

function leer(formData: FormData) {
  return {
    nombre: formData.get("nombre"),
    tipoRelacion: formData.get("tipoRelacion"),
    estado: formData.get("estado") || "activo",
  };
}

export async function crearCliente(formData: FormData): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const parsed = clienteSchema.safeParse(leer(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const [creado] = await db
      .insert(clientes)
      .values(parsed.data)
      .returning({ id: clientes.id });

    await registrarAuditoria({
      usuario,
      accion: "crear",
      entidad: "cliente",
      entidadId: creado.id,
      valoresDespues: parsed.data,
    });
    revalidatePath("/clientes");
    return { ok: true, id: creado.id };
  } catch (e) {
    return manejarError(e);
  }
}

export async function editarCliente(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const parsed = clienteSchema.safeParse(leer(formData));
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const [antes] = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, id))
      .limit(1);
    if (!antes) return { ok: false, error: "Cliente no encontrado" };

    await db.update(clientes).set(parsed.data).where(eq(clientes.id, id));
    await registrarAuditoria({
      usuario,
      accion: "editar",
      entidad: "cliente",
      entidadId: id,
      valoresAntes: antes,
      valoresDespues: parsed.data,
    });
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    return { ok: true, id };
  } catch (e) {
    return manejarError(e);
  }
}

function manejarError(e: unknown): ActionResult {
  if (e instanceof RespuestaError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Ocurrió un error inesperado" };
}
