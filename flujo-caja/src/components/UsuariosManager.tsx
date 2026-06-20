"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  invitarUsuario,
  revocarInvitacion,
  cambiarRol,
} from "@/app/actions/usuarios";

interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  rol: "admin" | "visor";
}
interface Invitacion {
  id: string;
  email: string;
  rol: "admin" | "visor";
}

export function UsuariosManager({
  usuarios,
  invitaciones,
  yoId,
}: {
  usuarios: Usuario[];
  invitaciones: Invitacion[];
  yoId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function invitar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await invitarUsuario(fd);
      if (res.ok) {
        setOk("Invitación enviada por correo");
        form.reset();
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo invitar");
      }
    });
  }

  function revocar(id: string) {
    if (!window.confirm("¿Revocar esta invitación?")) return;
    startTransition(async () => {
      const res = await revocarInvitacion(id);
      if (res.ok) router.refresh();
      else setError(res.error ?? "No se pudo revocar");
    });
  }

  function cambiar(id: string, rol: "admin" | "visor") {
    startTransition(async () => {
      const res = await cambiarRol(id, rol);
      if (res.ok) router.refresh();
      else setError(res.error ?? "No se pudo cambiar el rol");
    });
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Invitar */}
      <section className="rounded-xl bg-surface border border-border p-4">
        <h3 className="font-medium mb-1">Invitar nuevo founder</h3>
        <p className="text-xs text-muted mb-3">
          El sistema es cerrado: solo entran los correos que invites aquí. Clerk les
          envía un enlace para crear su cuenta.
        </p>
        <form onSubmit={invitar} className="flex flex-col sm:flex-row gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="correo@ejemplo.com"
            className="flex-1 rounded-lg border border-border px-3 py-2.5"
          />
          <select
            name="rol"
            defaultValue="visor"
            className="rounded-lg border border-border px-3 py-2.5"
          >
            <option value="visor">Visor</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent text-white px-4 py-2.5 font-medium disabled:opacity-50"
          >
            Invitar
          </button>
        </form>
        {error && <p className="text-egreso text-sm mt-2">{error}</p>}
        {ok && <p className="text-ingreso text-sm mt-2">{ok}</p>}
      </section>

      {/* Invitaciones pendientes */}
      {invitaciones.length > 0 && (
        <section className="rounded-xl bg-surface border border-border p-4">
          <h3 className="font-medium mb-3">Invitaciones pendientes</h3>
          <ul className="divide-y divide-border">
            {invitaciones.map((i) => (
              <li key={i.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm">{i.email}</p>
                  <p className="text-xs text-muted capitalize">{i.rol}</p>
                </div>
                <button
                  onClick={() => revocar(i.id)}
                  disabled={pending}
                  className="text-xs text-egreso border border-egreso/40 rounded-lg px-3 py-1.5"
                >
                  Revocar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Usuarios existentes */}
      <section className="rounded-xl bg-surface border border-border p-4">
        <h3 className="font-medium mb-3">Usuarios</h3>
        <ul className="divide-y divide-border">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5 gap-2">
              <div className="min-w-0">
                <p className="text-sm truncate">
                  {u.nombre ?? u.email}
                  {u.id === yoId && (
                    <span className="text-xs text-muted"> (tú)</span>
                  )}
                </p>
                {u.nombre && <p className="text-xs text-muted truncate">{u.email}</p>}
              </div>
              <select
                value={u.rol}
                disabled={pending || u.id === yoId}
                onChange={(e) => cambiar(u.id, e.target.value as "admin" | "visor")}
                className="rounded-lg border border-border px-2 py-1.5 text-sm disabled:opacity-60"
              >
                <option value="visor">Visor</option>
                <option value="admin">Admin</option>
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
