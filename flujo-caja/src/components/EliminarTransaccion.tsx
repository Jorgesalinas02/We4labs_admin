"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eliminarTransaccion } from "@/app/actions/transacciones";

export function EliminarTransaccion({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    const ok = window.confirm(
      "¿Seguro que quieres eliminar esta transacción? Quedará registrada en el historial de auditoría.",
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await eliminarTransaccion(id);
      if (res.ok) {
        router.push("/transacciones");
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo eliminar");
      }
    });
  }

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="w-full rounded-lg border border-egreso/40 text-egreso py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "Eliminando…" : "Eliminar transacción"}
      </button>
      {error && <p className="text-egreso text-sm mt-1">{error}</p>}
    </div>
  );
}
