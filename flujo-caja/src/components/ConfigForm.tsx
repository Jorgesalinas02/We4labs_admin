"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarConfig } from "@/app/actions/config";

export interface ConfigInicial {
  saldoInicialCop: string;
  saldoInicialFecha: string | null;
  umbralAlertaCop: string;
  monedaPorDefecto: "COP" | "USD";
  tasaCambioSugerida: string | null;
  requerirComprobante: boolean;
  requerirClienteIngresos: boolean;
  diasAlertaInactividad: number;
}

function Toggle({
  name,
  defaultChecked,
  label,
  ayuda,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  ayuda: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 accent-[var(--accent)]"
      />
      <span>
        <span className="text-sm font-medium block">{label}</span>
        <span className="text-xs text-muted">{ayuda}</span>
      </span>
    </label>
  );
}

export function ConfigForm({ inicial }: { inicial: ConfigInicial }) {
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
    <form onSubmit={onSubmit} className="space-y-6 max-w-lg">
      {/* Saldo */}
      <section className="rounded-xl bg-surface border border-border p-4 space-y-4">
        <h3 className="font-medium">Saldo y alertas</h3>
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
            El dashboard avisa si el saldo cae por debajo de este valor. 0 = sin alerta.
          </p>
        </div>
      </section>

      {/* Preferencias del formulario */}
      <section className="rounded-xl bg-surface border border-border p-4 space-y-4">
        <h3 className="font-medium">Formulario de transacciones</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Moneda por defecto</label>
          <select
            name="monedaPorDefecto"
            defaultValue={inicial.monedaPorDefecto}
            className="w-full rounded-lg border border-border px-3 py-2.5"
          >
            <option value="COP">COP (pesos colombianos)</option>
            <option value="USD">USD (dólares)</option>
          </select>
          <p className="text-xs text-muted mt-1">
            Con cuál moneda se abre el formulario al registrar.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Tasa de cambio USD→COP sugerida
          </label>
          <input
            name="tasaCambioSugerida"
            type="number"
            step="0.0001"
            min="0"
            defaultValue={inicial.tasaCambioSugerida ?? ""}
            placeholder="Ej. 4050"
            className="w-full rounded-lg border border-border px-3 py-2.5"
          />
          <p className="text-xs text-muted mt-1">
            Prellena la tasa al registrar en USD (siempre editable). Déjalo vacío si no quieres sugerencia.
          </p>
        </div>
      </section>

      {/* Reglas de captura */}
      <section className="rounded-xl bg-surface border border-border p-4 space-y-4">
        <h3 className="font-medium">Reglas de captura</h3>
        <Toggle
          name="requerirComprobante"
          defaultChecked={inicial.requerirComprobante}
          label="Exigir comprobante en cada transacción"
          ayuda="No deja guardar sin adjuntar foto o PDF del soporte."
        />
        <Toggle
          name="requerirClienteIngresos"
          defaultChecked={inicial.requerirClienteIngresos}
          label="Exigir cliente en los ingresos"
          ayuda="Obliga a asociar un cliente cuando el movimiento es un ingreso."
        />
        <div>
          <label className="block text-sm font-medium mb-1">
            Recordatorio por inactividad (días)
          </label>
          <input
            name="diasAlertaInactividad"
            type="number"
            min="0"
            step="1"
            defaultValue={inicial.diasAlertaInactividad}
            className="w-full rounded-lg border border-border px-3 py-2.5"
          />
          <p className="text-xs text-muted mt-1">
            Avisa si pasan estos días sin registrar ninguna transacción. 0 = desactivado.
          </p>
        </div>
      </section>

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
