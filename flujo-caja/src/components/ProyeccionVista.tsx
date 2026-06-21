"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoneda } from "@/lib/money";
import { crearEsperada } from "@/app/actions/transacciones";
import type { SemanaProyectada } from "@/lib/proyeccion";

const colorEstado: Record<string, string> = {
  comodo: "bg-ingreso",
  cerca: "bg-amber-500",
  bajo: "bg-egreso",
};

export function ProyeccionVista({
  semanas,
  cajaMinima,
  esAdmin,
  hoy,
}: {
  semanas: SemanaProyectada[];
  cajaMinima: number;
  esAdmin: boolean;
  hoy: string;
}) {
  const router = useRouter();
  const [soloReal, setSoloReal] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);

  const maxAbs = Math.max(
    1,
    ...semanas.map((s) =>
      Math.abs(soloReal ? s.saldoFinalReal : s.saldoFinalProyectado),
    ),
    cajaMinima,
  );

  function agregar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const res = await crearEsperada(fd);
      if (res.ok) {
        form.reset();
        setAbierto(false);
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo agregar");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Flujo de Caja Proyectado</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloReal}
            onChange={(e) => setSoloReal(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Solo real
        </label>
      </div>
      <p className="text-sm text-muted">
        Saldo proyectado por semana ({semanas.length} semanas).{" "}
        {cajaMinima > 0 && (
          <>Línea de caja mínima: {formatMoneda(cajaMinima)}.</>
        )}
      </p>

      {/* Barras */}
      <section className="rounded-xl bg-surface border border-border p-4 space-y-3">
        {semanas.map((s) => {
          const saldo = soloReal ? s.saldoFinalReal : s.saldoFinalProyectado;
          const ancho = Math.max(2, (Math.abs(saldo) / maxAbs) * 100);
          const lineaMin = cajaMinima > 0 ? (cajaMinima / maxAbs) * 100 : 0;
          return (
            <div key={s.inicio}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">Sem. {s.etiqueta}</span>
                <span
                  className={`font-medium ${
                    s.estado === "bajo"
                      ? "text-egreso"
                      : s.estado === "cerca"
                        ? "text-amber-600"
                        : "text-ingreso"
                  }`}
                >
                  {formatMoneda(saldo)}
                </span>
              </div>
              <div className="relative h-3 rounded-full bg-background overflow-hidden">
                <div
                  className={`h-full ${colorEstado[s.estado]} ${saldo < 0 ? "opacity-60" : ""}`}
                  style={{ width: `${ancho}%` }}
                />
                {lineaMin > 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
                    style={{ left: `${lineaMin}%` }}
                    title="Caja mínima"
                  />
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Tabla detalle */}
      <section className="rounded-xl bg-surface border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted text-xs border-b border-border">
              <th className="text-left p-3">Semana</th>
              <th className="text-right p-3">Entradas</th>
              <th className="text-right p-3">Salidas</th>
              <th className="text-right p-3">Saldo final</th>
            </tr>
          </thead>
          <tbody>
            {semanas.map((s) => {
              const entradas = soloReal
                ? s.entradasReales
                : s.entradasReales + s.entradasEsperadas;
              const salidas = soloReal
                ? s.salidasReales
                : s.salidasReales + s.salidasEsperadas;
              const saldo = soloReal ? s.saldoFinalReal : s.saldoFinalProyectado;
              return (
                <tr key={s.inicio} className="border-b border-border last:border-0">
                  <td className="p-3">{s.etiqueta}</td>
                  <td className="p-3 text-right text-ingreso">{formatMoneda(entradas)}</td>
                  <td className="p-3 text-right text-egreso">{formatMoneda(salidas)}</td>
                  <td
                    className={`p-3 text-right font-medium ${
                      saldo < cajaMinima ? "text-egreso" : ""
                    }`}
                  >
                    {formatMoneda(saldo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Agregar esperada */}
      {esAdmin && (
        <section className="rounded-xl bg-surface border border-border p-4">
          {!abierto ? (
            <button
              onClick={() => setAbierto(true)}
              className="text-sm rounded-lg bg-accent text-white px-4 py-2 font-medium"
            >
              + Agregar entrada/salida esperada
            </button>
          ) : (
            <form onSubmit={agregar} className="space-y-3">
              <p className="text-sm font-medium">Nueva fila esperada (no es real aún)</p>
              <div className="grid grid-cols-2 gap-2">
                <select name="tipo" className="rounded-lg border border-border px-3 py-2 text-sm">
                  <option value="ingreso">Entrada esperada</option>
                  <option value="egreso">Salida esperada</option>
                </select>
                <input
                  name="montoCop"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Monto COP"
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  name="fecha"
                  type="date"
                  required
                  defaultValue={hoy}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  name="descripcion"
                  required
                  placeholder="Ej. Anticipo esperado X"
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-egreso text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="flex-1 rounded-lg border border-border py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-accent text-white py-2 text-sm font-medium disabled:opacity-50"
                >
                  {pending ? "Agregando…" : "Agregar"}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
