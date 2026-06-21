"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoneda } from "@/lib/money";
import {
  crearObligacion,
  editarObligacion,
  eliminarObligacion,
  marcarPagada,
} from "@/app/actions/obligaciones";

export interface ObligacionItem {
  id: string;
  nombre: string;
  periodicidad: string;
  proximoVencimiento: string | null;
  diasAnticipacion: number;
  montoEstimadoCop: string | null;
  nota: string | null;
  activa: boolean;
}

const periodicidades = [
  { v: "mensual", l: "Mensual" },
  { v: "bimestral", l: "Bimestral" },
  { v: "cuatrimestral", l: "Cuatrimestral" },
  { v: "anual", l: "Anual" },
  { v: "otra", l: "Otra" },
];

function Formulario({
  inicial,
  onListo,
}: {
  inicial?: ObligacionItem;
  onListo: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = inicial
        ? await editarObligacion(inicial.id, fd)
        : await crearObligacion(fd);
      if (res.ok) {
        router.refresh();
        onListo();
      } else {
        setError(res.error ?? "No se pudo guardar");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border border-border p-3">
      <input
        name="nombre"
        required
        defaultValue={inicial?.nombre ?? ""}
        placeholder="Nombre (ej. IVA)"
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="periodicidad"
          defaultValue={inicial?.periodicidad ?? "mensual"}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          {periodicidades.map((p) => (
            <option key={p.v} value={p.v}>
              {p.l}
            </option>
          ))}
        </select>
        <input
          name="proximoVencimiento"
          type="date"
          defaultValue={inicial?.proximoVencimiento ?? ""}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          name="montoEstimadoCop"
          type="number"
          step="0.01"
          min="0"
          defaultValue={inicial?.montoEstimadoCop ?? ""}
          placeholder="Monto estimado (COP)"
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          name="diasAnticipacion"
          type="number"
          min="0"
          max="60"
          defaultValue={inicial?.diasAnticipacion ?? 5}
          placeholder="Días aviso"
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>
      <input
        name="nota"
        defaultValue={inicial?.nota ?? ""}
        placeholder="Nota (opcional)"
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
      />
      {error && <p className="text-egreso text-sm">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onListo}
          className="flex-1 rounded-lg border border-border py-2 text-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-accent text-white py-2 text-sm font-medium disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export function ObligacionesManager({ obligaciones }: { obligaciones: ObligacionItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pagar(o: ObligacionItem) {
    if (!o.montoEstimadoCop || Number(o.montoEstimadoCop) <= 0) {
      setError(`Define un monto estimado en "${o.nombre}" antes de marcarla pagada.`);
      return;
    }
    if (
      !window.confirm(
        `¿Registrar el pago de ${o.nombre} por ${formatMoneda(o.montoEstimadoCop)}? Se creará un egreso y la fecha rodará al siguiente periodo.`,
      )
    )
      return;
    startTransition(async () => {
      const res = await marcarPagada(o.id);
      if (res.ok) router.refresh();
      else setError(res.error ?? "No se pudo registrar el pago");
    });
  }

  function borrar(id: string) {
    if (!window.confirm("¿Quitar esta obligación del calendario?")) return;
    startTransition(async () => {
      const res = await eliminarObligacion(id);
      if (res.ok) router.refresh();
      else setError(res.error ?? "No se pudo eliminar");
    });
  }

  const activas = obligaciones.filter((o) => o.activa);

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Recordatorios de impuestos y obligaciones. No calcula montos: es ayuda de
          memoria y planeación de caja.
        </p>
        {!creando && (
          <button
            onClick={() => setCreando(true)}
            className="shrink-0 rounded-lg bg-accent text-white px-3 py-1.5 text-sm font-medium"
          >
            + Nueva
          </button>
        )}
      </div>

      {error && <p className="text-egreso text-sm">{error}</p>}
      {creando && <Formulario onListo={() => setCreando(false)} />}

      <ul className="space-y-2">
        {activas.map((o) =>
          editando === o.id ? (
            <li key={o.id}>
              <Formulario inicial={o} onListo={() => setEditando(null)} />
            </li>
          ) : (
            <li
              key={o.id}
              className="rounded-lg border border-border p-3 flex items-start justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{o.nombre}</p>
                <p className="text-xs text-muted capitalize">
                  {o.periodicidad}
                  {o.proximoVencimiento ? ` · vence ${o.proximoVencimiento}` : " · sin fecha"}
                  {o.montoEstimadoCop
                    ? ` · ~${formatMoneda(o.montoEstimadoCop)}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => pagar(o)}
                  disabled={pending}
                  className="text-xs text-ingreso border border-ingreso/40 rounded-lg px-2 py-1"
                >
                  Pagada
                </button>
                <button
                  onClick={() => setEditando(o.id)}
                  className="text-xs border border-border rounded-lg px-2 py-1"
                >
                  Editar
                </button>
                <button
                  onClick={() => borrar(o.id)}
                  disabled={pending}
                  className="text-xs text-egreso border border-egreso/40 rounded-lg px-2 py-1"
                >
                  Quitar
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
