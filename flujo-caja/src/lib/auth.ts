import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

export type Rol = "admin" | "visor";

export interface UsuarioActual {
  clerkId: string;
  email: string;
  nombre: string | null;
  rol: Rol;
}

// Forma de los claims personalizados del token de sesión de Clerk.
// Se activan configurando el "session token" en el dashboard (ver README).
interface ClaimsPersonalizados {
  metadata?: { role?: Rol };
  email?: string;
}

/**
 * Obtiene el usuario autenticado y su rol. Envuelto en `cache()` para que,
 * aunque se llame varias veces en una misma request (layout + página),
 * se resuelva una sola vez.
 *
 * Camino rápido: si el token de sesión trae el rol como claim, se lee sin
 * viaje de red. Si no, cae al fetch a Clerk (`currentUser`).
 *
 * Por seguridad, cualquier usuario sin rol explícito se trata como "visor".
 */
export const obtenerUsuarioActual = cache(
  async (): Promise<UsuarioActual | null> => {
    const { userId, sessionClaims } = await auth();
    if (!userId) return null;

    // Camino rápido: rol desde el claim del token (sin red).
    const claims = sessionClaims as ClaimsPersonalizados | undefined;
    const rolClaim = claims?.metadata?.role;
    if (rolClaim === "admin" || rolClaim === "visor") {
      return {
        clerkId: userId,
        email: claims?.email ?? "",
        nombre: null,
        rol: rolClaim,
      };
    }

    // Fallback: consulta a Clerk (un viaje de red).
    const user = await currentUser();
    if (!user) return null;

    const rol = (user.publicMetadata?.role as Rol) ?? "visor";
    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";
    const nombre =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      null;

    return { clerkId: userId, email, nombre, rol };
  },
);

/** Lanza si el usuario no es Admin. Usar en cada API route de escritura. */
export async function requireAdmin(): Promise<UsuarioActual> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    throw new RespuestaError(401, "No autenticado");
  }
  if (usuario.rol !== "admin") {
    throw new RespuestaError(403, "Requiere rol de administrador");
  }
  return usuario;
}

/** Lanza si no hay sesión. Para rutas de solo lectura. */
export async function requireUsuario(): Promise<UsuarioActual> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    throw new RespuestaError(401, "No autenticado");
  }
  return usuario;
}

export class RespuestaError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "RespuestaError";
  }
}
