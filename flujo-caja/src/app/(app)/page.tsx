import Link from "next/link";
import {
  obtenerResumenDashboard,
  obtenerUltimasTransacciones,
  serieMensual,
  type EstadoCaja,
} from "@/lib/queries";
import { construirProyeccion } from "@/lib/proyeccion";
import { obtenerUsuarioActual } from "@/lib/auth";
import { formatMoneda } from "@/lib/money";
import { etiquetaMes } from "@/lib/dates";
import { BarrasMensuales } from "@/components/dashboard/BarrasMensuales";
import { AreaSaldo } from "@/components/dashboard/AreaSaldo";
import { HistorialPagos } from "@/components/dashboard/HistorialPagos";

export const dynamic = "force-dynamic";

const gradiente: Record<EstadoCaja, string> = {
  comodo: "linear-gradient(135deg,#16a34a,#15803d 55%,#0f5132)",
  cerca: "linear-gradient(135deg,#f59e0b,#d97706 55%,#92400e)",
  bajo: "linear-gradient(135deg,#ef4444,#dc2626 55%,#991b1b)",
};
const textoEstado: Record<EstadoCaja, string> = {
  comodo: "Caja cómoda",
  cerca: "Cerca del mínimo",
  bajo: "Bajo el mínimo",
};

function Badge({ actual, anterior }: { actual: number; anterior: number }) {
  const diff = actual - anterior;
  const subio = diff >= 0;
  const pct = anterior > 0 ? Math.round((diff / anterior) * 100) : actual > 0 ? 100 : 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        subio ? "bg-ingreso-bg text-ingreso" : "bg-egreso-bg text-egreso"
      }`}
    >
      {subio ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl bg-surface border border-border/70 p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default async function DashboardPage() {
  const [resumen, ultimas, serie, proyeccion, usuario] = await Promise.all([
    obtenerResumenDashboard(),
    obtenerUltimasTransacciones(8),
    serieMensual(6),
    construirProyeccion(),
    obtenerUsuarioActual(),
  ]);

  const nombre =
    usuario?.nombre?.split(" ")[0] ??
    usuario?.email?.split("@")[0] ??
    "founder";
  const esAdmin = usuario?.rol === "admin";
  const totalDesglose = resumen.desgloseEgresos.reduce((a, b) => a + b.total, 0);
  const proxSaldo =
    proyeccion.semanas[proyeccion.semanas.length - 1]?.saldoFinalProyectado ??
    resumen.saldoActual;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold capitalize">
            Hola, <span className="text-muted font-semibold">{nombre}</span>
          </h1>
          <p className="text-sm text-muted capitalize">{etiquetaMes()}</p>
        </div>
        {esAdmin && (
          <Link
            href="/transacciones/nueva"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-brand text-white px-4 py-2 text-sm font-medium"
          >
            + Nueva transacción
          </Link>
        )}
      </div>

      {/* Fila 1: saldo + barras */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Saldo hero */}
        <div
          className="rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between min-h-[180px]"
          style={{ background: gradiente[resumen.estado] }}
        >
          <div className="flex items-center justify-between">
            <p className="text-white/80 text-sm">Saldo disponible</p>
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">
              {textoEstado[resumen.estado]}
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold mt-2">{formatMoneda(resumen.saldoActual)}</p>
            {resumen.cajaMinima > 0 && (
              <p className="text-white/80 text-xs mt-1">
                Caja mínima {formatMoneda(resumen.cajaMinima)}
              </p>
            )}
          </div>
          <div className="flex gap-4 text-sm mt-3">
            <div>
              <p className="text-white/70 text-xs">Ingresos mes</p>
              <p className="font-semibold">{formatMoneda(resumen.ingresosMes)}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">Egresos mes</p>
              <p className="font-semibold">{formatMoneda(resumen.egresosMes)}</p>
            </div>
          </div>
        </div>

        {/* Barras mensuales */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Ingresos vs egresos</h2>
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-ingreso" /> Ingresos
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-egreso" /> Egresos
              </span>
            </div>
          </div>
          <BarrasMensuales datos={serie} />
        </Card>
      </div>

      {/* Fila 2: 3 mini stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <p className="text-muted text-sm">Ingresos del mes</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xl font-bold text-ingreso">{formatMoneda(resumen.ingresosMes)}</p>
            <Badge actual={resumen.ingresosMes} anterior={resumen.ingresosMesAnterior} />
          </div>
        </Card>
        <Card>
          <p className="text-muted text-sm">Egresos del mes</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xl font-bold text-egreso">{formatMoneda(resumen.egresosMes)}</p>
            <Badge actual={resumen.egresosMes} anterior={resumen.egresosMesAnterior} />
          </div>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <p className="text-muted text-sm">Utilidad del mes (caja)</p>
          <p
            className={`text-xl font-bold mt-1 ${
              resumen.utilidadMes >= 0 ? "text-ingreso" : "text-egreso"
            }`}
          >
            {formatMoneda(resumen.utilidadMes)}
          </p>
        </Card>
      </div>

      {/* Fila 3: proyección + obligaciones */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Saldo proyectado</h2>
            <Link href="/proyeccion" className="text-accent text-sm hover:underline">
              Ver detalle
            </Link>
          </div>
          <p className="text-2xl font-bold mb-2">{formatMoneda(proxSaldo)}</p>
          <AreaSaldo semanas={proyeccion.semanas} cajaMinima={proyeccion.cajaMinima} />
        </Card>

        <Card>
          <h2 className="font-semibold mb-3">Próximas obligaciones</h2>
          {resumen.obligacionesProximas.length === 0 ? (
            <p className="text-muted text-sm">
              Sin fechas configuradas.{" "}
              <Link href="/configuracion" className="text-accent hover:underline">
                Definir
              </Link>
            </p>
          ) : (
            <ul className="space-y-2.5">
              {resumen.obligacionesProximas.map((o) => {
                const vencido = (o.diasRestantes ?? 0) < 0;
                const pronto = (o.diasRestantes ?? 99) <= 5;
                return (
                  <li key={o.id} className="flex items-center justify-between text-sm">
                    <span>{o.nombre}</span>
                    <span
                      className={`text-xs ${
                        vencido ? "text-egreso" : pronto ? "text-amber-600" : "text-muted"
                      }`}
                    >
                      {vencido
                        ? `vencido ${Math.abs(o.diasRestantes ?? 0)}d`
                        : `en ${o.diasRestantes}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Fila 4: desglose + historial */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <h2 className="font-semibold mb-3">Egresos del mes</h2>
          {resumen.desgloseEgresos.length === 0 ? (
            <p className="text-muted text-sm">Aún no hay egresos este mes.</p>
          ) : (
            <ul className="space-y-2">
              {resumen.desgloseEgresos
                .sort((a, b) => b.total - a.total)
                .map((d) => {
                  const pct = totalDesglose > 0 ? (d.total / totalDesglose) * 100 : 0;
                  return (
                    <li key={d.madre}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate pr-2">{d.madre}</span>
                        <span className="font-medium shrink-0">{formatMoneda(d.total)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-background overflow-hidden">
                        <div className="h-full bg-egreso" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}

          <h2 className="font-semibold mt-5 mb-2">Top clientes</h2>
          {resumen.topClientes.length === 0 ? (
            <p className="text-muted text-sm">Sin ingresos por cliente.</p>
          ) : (
            <ul className="space-y-1.5">
              {resumen.topClientes.map((c) => (
                <li key={c.clienteId} className="flex justify-between text-sm">
                  <Link href={`/clientes/${c.clienteId}`} className="hover:underline truncate pr-2">
                    {c.nombre}
                  </Link>
                  <span className="font-medium text-ingreso shrink-0">
                    {formatMoneda(c.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-semibold mb-1">Movimientos recientes</h2>
          <HistorialPagos items={ultimas} />
        </Card>
      </div>
    </div>
  );
}
