import { redirect } from "next/navigation";
import { db } from "@/db";
import { logAuditoria } from "@/db/schema";
import { desc } from "drizzle-orm";
import { obtenerUsuarioActual } from "@/lib/auth";

export const dynamic = "force-dynamic";

const etiquetaAccion: Record<string, string> = {
  login: "Inicio de sesión",
  crear: "Creó",
  editar: "Editó",
  eliminar: "Eliminó",
  invitar: "Invitó",
  cambiar_rol: "Cambió rol",
};

export default async function AuditoriaPage() {
  const usuario = await obtenerUsuarioActual();
  if (usuario?.rol !== "admin") redirect("/");

  const registros = await db
    .select()
    .from(logAuditoria)
    .orderBy(desc(logAuditoria.createdAt))
    .limit(200);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Historial de auditoría</h1>
      <p className="text-sm text-muted">
        Registro inmutable de las acciones del sistema. No se puede editar ni borrar.
      </p>

      {registros.length === 0 ? (
        <p className="text-muted text-sm">Sin actividad registrada todavía.</p>
      ) : (
        <ul className="rounded-xl bg-surface border border-border divide-y divide-border">
          {registros.map((r) => (
            <li key={r.id} className="px-4 py-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">
                  {etiquetaAccion[r.accion] ?? r.accion}{" "}
                  <span className="text-muted font-normal">{r.entidad}</span>
                </span>
                <span className="text-xs text-muted shrink-0">
                  {r.createdAt.toLocaleString("es-CO")}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {r.usuarioEmail ?? r.usuario}
                {r.detalle ? ` · ${r.detalle}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
