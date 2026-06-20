"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarConfig } from "@/app/actions/config";

export function ConfigForm({
  inicial,
}: {
  inicial: {
    saldoInicialCop: string;
    saldoInicialFecha: string | null;
    umbralAlertaCop: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await guardarConfig(fd);
      if (res.ok) {
        setMensaje("Configuración guardada");
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo guardar");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl bg-surface border border-border p-4 space-y-4 max-w-lg"
    >
      <div>
        <label className="block text-sm font-medium mb-1">
          Saldo inicial de la cuenta (COP)
        </label>
        <input
          name="saldoInicialCop"
          type="number"
          step="0.01"
          defaultValue={inicial.saldoInicialCop}
          className="w-full rounded-lg border border-border px-3 py-2.5"
        />
        <p className="text-xs text-muted mt-1">
          Cuánto dinero había en la cuenta antes de empezar a registrar aquí.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Fecha de corte</label>
        <input
          name="saldoInicialFecha"
          type="date"
          defaultValue={inicial.saldoInicialFecha ?? ""}
          className="w-full rounded-lg border border-border px-3 py-2.5"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Umbral de alerta de caja baja (COP)
        </label>
        <input
          name="umbralAlertaCop"
          type="number"
          step="0.01"
          min="0"
          defaultValue={inicial.umbralAlertaCop}
          className="w-full rounded-lg border border-border px-3 py-2.5"
        />
        <p className="text-xs text-muted mt-1">
          El dashboard avisa si el saldo actual cae por debajo de este valor. 0 = sin alerta.
        </p>
      </div>
      {error && <p className="text-egreso text-sm">{error}</p>}
      {mensaje && <p className="text-ingreso text-sm">{mensaje}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent text-white px-4 py-2.5 font-medium disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
