"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requireAdmin, RespuestaError } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit";
import {
  invitarUsuarioClerk,
  revocarInvitacionClerk,
  cambiarRolUsuarioClerk,
} from "@/lib/clerk-admin";
import type { ActionResult } from "./transacciones";

const invitacionSchema = z.object({
  email: z.string().email("Correo inválido"),
  rol: z.enum(["admin", "visor"]),
});

async function urlRegistro(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}/sign-up`;
}

export async function invitarUsuario(formData: FormData): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    const parsed = invitacionSchema.safeParse({
      email: formData.get("email"),
      rol: formData.get("rol"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }

    await invitarUsuarioClerk(parsed.data.email, parsed.data.rol, await urlRegistro());

    await registrarAuditoria({
      usuario,
      accion: "invitar",
      entidad: "usuario",
      detalle: `Invitó a ${parsed.data.email} como ${parsed.data.rol}`,
      valoresDespues: parsed.data,
    });
    revalidatePath("/configuracion");
    return { ok: true };
  } catch (e) {
    return manejarError(e, "No se pudo enviar la invitación");
  }
}

export async function revocarInvitacion(id: string): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    await revocarInvitacionClerk(id);
    await registrarAuditoria({
      usuario,
      accion: "invitar",
      entidad: "invitacion",
      entidadId: id,
      detalle: "Revocó la invitación",
    });
    revalidatePath("/configuracion");
    return { ok: true };
  } catch (e) {
    return manejarError(e, "No se pudo revocar la invitación");
  }
}

export async function cambiarRol(
  usuarioId: string,
  rol: "admin" | "visor",
): Promise<ActionResult> {
  try {
    const usuario = await requireAdmin();
    // Evita que un admin se quite el rol a sí mismo y se quede sin acceso.
    if (usuarioId === usuario.clerkId && rol !== "admin") {
      return { ok: false, error: "No puedes quitarte a ti mismo el rol de admin" };
    }
    await cambiarRolUsuarioClerk(usuarioId, rol);
    await registrarAuditoria({
      usuario,
      accion: "cambiar_rol",
      entidad: "usuario",
      entidadId: usuarioId,
      detalle: `Cambió el rol a ${rol}`,
      valoresDespues: { rol },
    });
    revalidatePath("/configuracion");
    return { ok: true };
  } catch (e) {
    return manejarError(e, "No se pudo cambiar el rol");
  }
}

function manejarError(e: unknown, fallback: string): ActionResult {
  if (e instanceof RespuestaError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: fallback };
}
