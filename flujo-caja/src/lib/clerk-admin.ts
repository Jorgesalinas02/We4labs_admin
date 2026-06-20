import { clerkClient } from "@clerk/nextjs/server";
import type { Rol } from "./auth";

export interface UsuarioAdmin {
  id: string;
  email: string;
  nombre: string | null;
  rol: Rol;
  creado: number;
  ultimoAcceso: number | null;
}

export interface InvitacionAdmin {
  id: string;
  email: string;
  rol: Rol;
  estado: string;
  creada: number;
}

/** Lista los usuarios existentes (founders ya dentro del sistema). */
export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const client = await clerkClient();
  const { data } = await client.users.getUserList({ limit: 100 });
  return data.map((u) => ({
    id: u.id,
    email:
      u.primaryEmailAddress?.emailAddress ??
      u.emailAddresses[0]?.emailAddress ??
      "",
    nombre: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || null,
    rol: ((u.publicMetadata?.role as Rol) ?? "visor") as Rol,
    creado: u.createdAt,
    ultimoAcceso: u.lastActiveAt ?? null,
  }));
}

/** Lista invitaciones pendientes (correos invitados que aún no entran). */
export async function listarInvitaciones(): Promise<InvitacionAdmin[]> {
  const client = await clerkClient();
  const { data } = await client.invitations.getInvitationList({
    status: "pending",
  });
  return data.map((i) => ({
    id: i.id,
    email: i.emailAddress,
    rol: ((i.publicMetadata?.role as Rol) ?? "visor") as Rol,
    estado: i.status,
    creada: i.createdAt,
  }));
}

/**
 * Crea una invitación. Clerk envía el correo con el enlace de registro.
 * El rol queda guardado en publicMetadata y se aplica al aceptar la invitación.
 */
export async function invitarUsuarioClerk(
  email: string,
  rol: Rol,
  redirectUrl: string,
): Promise<void> {
  const client = await clerkClient();
  await client.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role: rol },
    redirectUrl,
    ignoreExisting: true,
  });
}

export async function revocarInvitacionClerk(invitacionId: string): Promise<void> {
  const client = await clerkClient();
  await client.invitations.revokeInvitation(invitacionId);
}

/** Cambia el rol de un usuario ya existente. */
export async function cambiarRolUsuarioClerk(
  usuarioId: string,
  rol: Rol,
): Promise<void> {
  const client = await clerkClient();
  await client.users.updateUserMetadata(usuarioId, {
    publicMetadata: { role: rol },
  });
}
