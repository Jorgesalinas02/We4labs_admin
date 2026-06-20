import { db } from "@/db";
import { logAuditoria } from "@/db/schema";
import type { UsuarioActual } from "./auth";

type Accion = "login" | "crear" | "editar" | "eliminar" | "invitar" | "cambiar_rol";

interface RegistroAuditoria {
  usuario: UsuarioActual;
  accion: Accion;
  entidad: string;
  entidadId?: string;
  valoresAntes?: unknown;
  valoresDespues?: unknown;
  detalle?: string;
}

/**
 * Escribe una entrada inmutable en el log de auditoría. Las transacciones
 * nunca se borran físicamente; toda escritura relevante pasa por aquí.
 */
export async function registrarAuditoria(r: RegistroAuditoria): Promise<void> {
  await db.insert(logAuditoria).values({
    usuario: r.usuario.clerkId,
    usuarioEmail: r.usuario.email,
    accion: r.accion,
    entidad: r.entidad,
    entidadId: r.entidadId ?? null,
    valoresAntes: (r.valoresAntes as object) ?? null,
    valoresDespues: (r.valoresDespues as object) ?? null,
    detalle: r.detalle ?? null,
  });
}
