import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { obtenerDetalleCliente } from "@/lib/queries";
import { formatMoneda } from "@/lib/money";
import { TransaccionRow } from "@/components/TransaccionRow";
import { ClienteForm } from "@/components/ClienteForm";

export const dynamic = "force-dynamic";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await obtenerUsuarioActual();
  const esAdmin = usuario?.rol === "admin";

  const detalle = await obtenerDetalleCliente(id);
  if (!detalle) notFound();
  const { cliente, ingresado, gastado, rentabilidadCaja, movimientos } = detalle;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/clientes" className="text-muted">
          ‹
        </Link>
        <h1 className="text-lg font-semibold">{cliente.nombre}</h1>
      </div>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-surface border border-border p-3">
          <p className="text-xs text-muted">Ingresado</p>
          <p className="text-sm font-bold text-ingreso">{formatMoneda(ingresado)}</p>
        </div>
        <div className="rounded-xl bg-surface border border-border p-3">
          <p className="text-xs text-muted">Gastado</p>
          <p className="text-sm font-bold text-egreso">{formatMoneda(gastado)}</p>
        </div>
        <div className="rounded-xl bg-surface border border-border p-3">
          <p className="text-xs text-muted">Neto (caja)</p>
          <p
            className={`text-sm font-bold ${
              rentabilidadCaja >= 0 ? "text-ingreso" : "text-egreso"
            }`}
          >
            {formatMoneda(rentabilidadCaja)}
          </p>
        </div>
      </section>
      <p className="text-xs text-muted -mt-2">
        * Rentabilidad de caja (lo que entró menos lo que salió). No es utilidad
        contable: un anticipo entra como ingreso aunque el trabajo no se haya entregado.
      </p>

      {esAdmin && (
        <ClienteForm
          inicial={{
            id: cliente.id,
            nombre: cliente.nombre,
            tipoRelacion: cliente.tipoRelacion,
            estado: cliente.estado,
          }}
        />
      )}

      <section className="rounded-xl bg-surface border border-border p-4">
        <h2 className="font-medium mb-2">Historial</h2>
        {movimientos.length === 0 ? (
          <p className="text-muted text-sm">Sin transacciones asociadas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {movimientos.map((t) => (
              <TransaccionRow
                key={t.id}
                t={t}
                href={esAdmin ? `/transacciones/${t.id}` : undefined}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
