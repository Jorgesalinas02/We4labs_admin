import Link from "next/link";
import {
  obtenerResumenDashboard,
  obtenerUltimasTransacciones,
} from "@/lib/queries";
import { formatMoneda } from "@/lib/money";
import { etiquetaMes } from "@/lib/dates";
import { TransaccionRow } from "@/components/TransaccionRow";

export const dynamic = "force-dynamic";

const etiquetaGrupo: Record<string, string> = {
  nomina: "Nómina founders",
  operativo: "Operativo",
  cliente: "Relacionado a clientes",
  admin: "Administrativo/legal",
  marketing: "Marketing y ventas",
  otro: "Otros",
  na: "Sin grupo",
};

function Comparativo({ actual, anterior }: { actual: number; anterior: number }) {
  const diff = actual - anterior;
  const subio = diff >= 0;
  const pct =
    anterior > 0 ? Math.round((diff / anterior) * 100) : actual > 0 ? 100 : 0;
  return (
    <span className={`text-xs ${subio ? "text-ingreso" : "text-egreso"}`}>
      {subio ? "▲" : "▼"} {Math.abs(pct)}% vs mes anterior
    </span>
  );
}

export default async function DashboardPage() {
  const [resumen, ultimas] = await Promise.all([
    obtenerResumenDashboard(),
    obtenerUltimasTransacciones(10),
  ]);

  const totalDesglose = resumen.desgloseEgresos.reduce((a, b) => a + b.total, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Resumen · {etiquetaMes()}</h1>
      </div>

      {resumen.alertaCajaBaja && (
        <div className="rounded-lg border border-egreso/30 bg-egreso-bg px-4 py-3 text-sm text-egreso">
          ⚠️ El saldo actual está por debajo del umbral de alerta configurado
          ({formatMoneda(resumen.umbralAlerta)}).
        </div>
      )}

      {/* Saldo */}
      <section className="rounded-xl bg-brand text-white p-5">
        <p className="text-white/70 text-sm">Saldo disponible hoy</p>
        <p className="text-3xl font-bold mt-1">{formatMoneda(resumen.saldoActual)}</p>
      </section>

      {/* Ingresos / Egresos del mes */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface border border-border p-4">
          <p className="text-muted text-sm">Ingresos del mes</p>
          <p className="text-xl font-bold text-ingreso mt-1">
            {formatMoneda(resumen.ingresosMes)}
          </p>
          <Comparativo actual={resumen.ingresosMes} anterior={resumen.ingresosMesAnterior} />
        </div>
        <div className="rounded-xl bg-surface border border-border p-4">
          <p className="text-muted text-sm">Egresos del mes</p>
          <p className="text-xl font-bold text-egreso mt-1">
            {formatMoneda(resumen.egresosMes)}
          </p>
          <Comparativo actual={resumen.egresosMes} anterior={resumen.egresosMesAnterior} />
        </div>
      </section>

      <section className="rounded-xl bg-surface border border-border p-4">
        <p className="text-muted text-sm">Utilidad del mes (caja)</p>
        <p
          className={`text-2xl font-bold mt-1 ${
            resumen.utilidadMes >= 0 ? "text-ingreso" : "text-egreso"
          }`}
        >
          {formatMoneda(resumen.utilidadMes)}
        </p>
      </section>

      {/* Desglose de egresos */}
      <section className="rounded-xl bg-surface border border-border p-4">
        <h2 className="font-medium mb-3">Desglose de egresos del mes</h2>
        {resumen.desgloseEgresos.length === 0 ? (
          <p className="text-muted text-sm">Aún no hay egresos este mes.</p>
        ) : (
          <ul className="space-y-2">
            {resumen.desgloseEgresos
              .sort((a, b) => b.total - a.total)
              .map((d) => {
                const pct = totalDesglose > 0 ? (d.total / totalDesglose) * 100 : 0;
                return (
                  <li key={d.grupo}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{etiquetaGrupo[d.grupo] ?? d.grupo}</span>
                      <span className="font-medium">{formatMoneda(d.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-background overflow-hidden">
                      <div
                        className="h-full bg-egreso"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {/* Top clientes */}
      <section className="rounded-xl bg-surface border border-border p-4">
        <h2 className="font-medium mb-3">Top clientes por ingreso del mes</h2>
        {resumen.topClientes.length === 0 ? (
          <p className="text-muted text-sm">Sin ingresos por cliente este mes.</p>
        ) : (
          <ul className="space-y-2">
            {resumen.topClientes.map((c) => (
              <li key={c.clienteId} className="flex justify-between text-sm">
                <Link href={`/clientes/${c.clienteId}`} className="hover:underline">
                  {c.nombre}
                </Link>
                <span className="font-medium text-ingreso">
                  {formatMoneda(c.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Últimas transacciones */}
      <section className="rounded-xl bg-surface border border-border p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium">Últimas transacciones</h2>
          <Link href="/transacciones" className="text-accent text-sm hover:underline">
            Ver todas
          </Link>
        </div>
        {ultimas.length === 0 ? (
          <p className="text-muted text-sm">Todavía no hay transacciones registradas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {ultimas.map((t) => (
              <TransaccionRow key={t.id} t={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
