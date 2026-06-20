"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearCliente, editarCliente } from "@/app/actions/clientes";

interface Props {
  inicial?: {
    id: string;
    nombre: string;
    tipoRelacion: "anticipo" | "recurrente" | "ambos";
    estado: "activo" | "inactivo";
  };
}

export function ClienteForm({ inicial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(!!inicial);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-medium"
      >
        + Nuevo cliente
      </button>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = inicial
        ? await editarCliente(inicial.id, fd)
        : await crearCliente(fd);
      if (res.ok) {
        router.refresh();
        if (!inicial) setAbierto(false);
      } else {
        setError(res.error ?? "No se pudo guardar");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl bg-surface border border-border p-4 space-y-3"
    >
      <input
        name="nombre"
        required
        defaultValue={inicial?.nombre ?? ""}
        placeholder="Nombre del cliente / proyecto"
        className="w-full rounded-lg border border-border px-3 py-2"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="tipoRelacion"
          defaultValue={inicial?.tipoRelacion ?? "ambos"}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="anticipo">Anticipo único</option>
          <option value="recurrente">Recurrente</option>
          <option value="ambos">Ambos</option>
        </select>
        <select
          name="estado"
          defaultValue={inicial?.estado ?? "activo"}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
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
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
