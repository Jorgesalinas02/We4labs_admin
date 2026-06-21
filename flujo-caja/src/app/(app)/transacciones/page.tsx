import Link from "next/link";
import { obtenerUsuarioActual } from "@/lib/auth";
import {
  listarTransacciones,
  listarMadres,
  listarClientes,
  type FiltrosTransaccion,
} from "@/lib/queries";
import { formatMoneda } from "@/lib/money";

export const dynamic = "force-dynamic";

function limpiar(v: string | undefined): string | undefined {
  return v && v.length > 0 ? v : undefined;
}

export default async function TransaccionesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const usuario = await obtenerUsuarioActual();
  const esAdmin = usuario?.rol === "admin";

  const filtros: FiltrosTransaccion = {
    tipo: sp.tipo === "ingreso" || sp.tipo === "egreso" ? sp.tipo : undefined,
    madreId: limpiar(sp.categoria),
    clienteId: limpiar(sp.cliente),
    desde: limpiar(sp.desde),
    hasta: limpiar(sp.hasta),
  };

  const [movimientos, madres, clientes] = await Promise.all([
    listarTransacciones(filtros),
    listarMadres(),
    listarClientes(),
  ]);

  const totalIngresos = movimientos
    .filter((m) => m.tipo === "ingreso")
    .reduce((a, m) => a + Number(m.montoCop), 0);
  const totalEgresos = movimientos
    .filter((m) => m.tipo === "egreso")
    .reduce((a, m) => a + Number(m.montoCop), 0);

  const queryExport = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Transacciones</h1>
        <Link
          href={`/api/export${queryExport ? `?${queryExport}` : ""}`}
          className="text-sm rounded-lg border border-border px-3 py-1.5 hover:bg-surface"
          prefetch={false}
        >
          ⬇ Exportar CSV
        </Link>
      </div>

      {/* Filtros */}
      <form
        method="get"
        className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl bg-surface border border-border p-3"
      >
        <select
          name="tipo"
          defaultValue={sp.tipo ?? ""}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        >
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingresos</option>
          <option value="egreso">Egresos</option>
        </select>
        <select
          name="categoria"
          defaultValue={sp.categoria ?? ""}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {madres.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          name="cliente"
          defaultValue={sp.cliente ?? ""}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        >
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="desde"
          defaultValue={sp.desde ?? ""}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        />
        <input
          type="date"
          name="hasta"
          defaultValue={sp.hasta ?? ""}
          className="rounded-lg border border-border bg-surface px-2 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-brand text-white px-3 py-2 text-sm"
          >
            Filtrar
          </button>
          <Link
            href="/transacciones"
            className="rounded-lg border border-border px-3 py-2 text-sm flex items-center"
          >
            Limpiar
          </Link>
        </div>
      </form>

      {/* Totales del resultado */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-surface border border-border p-2">
          <p className="text-xs text-muted">Ingresos</p>
          <p className="text-sm font-bold text-ingreso">{formatMoneda(totalIngresos)}</p>
        </div>
        <div className="rounded-lg bg-surface border border-border p-2">
          <p className="text-xs text-muted">Egresos</p>
          <p className="text-sm font-bold text-egreso">{formatMoneda(totalEgresos)}</p>
        </div>
        <div className="rounded-lg bg-surface border border-border p-2">
          <p className="text-xs text-muted">Neto</p>
          <p
            className={`text-sm font-bold ${
              totalIngresos - totalEgresos >= 0 ? "text-ingreso" : "text-egreso"
            }`}
          >
            {formatMoneda(totalIngresos - totalEgresos)}
          </p>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl bg-surface border border-border divide-y divide-border">
        {movimientos.length === 0 ? (
          <p className="text-muted text-sm p-4">No hay transacciones con estos filtros.</p>
        ) : (
          movimientos.map((t) => (
            <Link
              key={t.id}
              href={esAdmin ? `/transacciones/${t.id}` : "#"}
              className={`flex items-center gap-3 px-3 py-3 ${
                esAdmin ? "hover:bg-background" : "pointer-events-none"
              }`}
            >
              <span
                className={`w-1.5 h-9 rounded-full ${
                  t.tipo === "ingreso" ? "bg-ingreso" : "bg-egreso"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.descripcion}</p>
                <p className="text-xs text-muted truncate">
                  {t.categoriaNombre}
                  {t.clienteNombre ? ` · ${t.clienteNombre}` : ""} · {t.fecha}
                  {t.comprobanteUrl ? " · 📎" : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-bold ${
                    t.tipo === "ingreso" ? "text-ingreso" : "text-egreso"
                  }`}
                >
                  {t.tipo === "ingreso" ? "+" : "−"}
                  {formatMoneda(t.montoCop)}
                </p>
                {t.moneda !== "COP" && (
                  <p className="text-[11px] text-muted">
                    {formatMoneda(t.montoOriginal, "USD")}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
