import { auth, currentUser } from "@clerk/nextjs/server";

export type Rol = "admin" | "visor";

export interface UsuarioActual {
  clerkId: string;
  email: string;
  nombre: string | null;
  rol: Rol;
}

/**
 * Obtiene el usuario autenticado y su rol. El rol vive en
 * publicMetadata.role de Clerk. Por seguridad, cualquier usuario sin rol
 * explícito se trata como "visor" (sin permisos de escritura).
 */
export async function obtenerUsuarioActual(): Promise<UsuarioActual | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const rol = (user.publicMetadata?.role as Rol) ?? "visor";
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    "";
  const nombre =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || null;

  return { clerkId: userId, email, nombre, rol };
}

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
