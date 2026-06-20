import Link from "next/link";
import { obtenerUsuarioActual } from "@/lib/auth";
import { listarClientes } from "@/lib/queries";
import { ClienteForm } from "@/components/ClienteForm";

export const dynamic = "force-dynamic";

const etiquetaRelacion: Record<string, string> = {
  anticipo: "Anticipo único",
  recurrente: "Recurrente",
  ambos: "Anticipo + recurrente",
};

export default async function ClientesPage() {
  const usuario = await obtenerUsuarioActual();
  const esAdmin = usuario?.rol === "admin";
  const clientes = await listarClientes();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Clientes</h1>
        {esAdmin && <ClienteForm />}
      </div>

      {clientes.length === 0 ? (
        <p className="text-muted text-sm">Aún no hay clientes registrados.</p>
      ) : (
        <ul className="rounded-xl bg-surface border border-border divide-y divide-border">
          {clientes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-background"
              >
                <div>
                  <p className="font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted">
                    {etiquetaRelacion[c.tipoRelacion]}
                    {c.estado === "inactivo" ? " · Inactivo" : ""}
                  </p>
                </div>
                <span className="text-muted">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
