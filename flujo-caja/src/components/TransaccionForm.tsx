"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { crearTransaccion, editarTransaccion } from "@/app/actions/transacciones";

interface Categoria {
  id: string;
  nombre: string;
  tipo: "ingreso" | "egreso";
  grupoGasto: string;
  descripcionDummies: string;
}
interface Cliente {
  id: string;
  nombre: string;
  estado: string;
}

export interface ValoresIniciales {
  id?: string;
  tipo: "ingreso" | "egreso";
  categoriaId: string;
  clienteId: string | null;
  moneda: "COP" | "USD";
  montoOriginal: string;
  tasaCambio: string;
  fecha: string;
  descripcion: string;
  metodoPago: string | null;
  comprobanteUrl: string | null;
  comprobantePathname: string | null;
}

export function TransaccionForm({
  categorias,
  clientes,
  hoy,
  inicial,
}: {
  categorias: Categoria[];
  clientes: Cliente[];
  hoy: string;
  inicial?: ValoresIniciales;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<"ingreso" | "egreso">(inicial?.tipo ?? "egreso");
  const [categoriaId, setCategoriaId] = useState(inicial?.categoriaId ?? "");
  const [moneda, setMoneda] = useState<"COP" | "USD">(inicial?.moneda ?? "COP");
  const [clienteId, setClienteId] = useState(inicial?.clienteId ?? "");

  // Subida de comprobante
  const [comprobanteUrl, setComprobanteUrl] = useState(inicial?.comprobanteUrl ?? "");
  const [comprobantePathname, setComprobantePathname] = useState(
    inicial?.comprobantePathname ?? "",
  );
  const [subiendo, setSubiendo] = useState(false);

  const categoriasFiltradas = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo],
  );
  const categoriaSel = categorias.find((c) => c.id === categoriaId);
  // El cliente es obligatorio para gastos de cliente y para ingresos de proyecto/recurrentes.
  const clienteSugerido =
    categoriaSel?.grupoGasto === "cliente" ||
    (categoriaSel?.tipo === "ingreso" && categoriaSel.grupoGasto === "na");

  function cambiarTipo(nuevo: "ingreso" | "egreso") {
    setTipo(nuevo);
    setCategoriaId(""); // resetea categoría al cambiar tipo
  }

  async function subirComprobante(file: File) {
    setSubiendo(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/comprobantes", { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "No se pudo subir el comprobante");
      }
      const j = await res.json();
      setComprobanteUrl(j.url);
      setComprobantePathname(j.pathname);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir comprobante");
    } finally {
      setSubiendo(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("tipo", tipo);
    formData.set("moneda", moneda);
    if (comprobanteUrl) {
      formData.set("comprobanteUrl", comprobanteUrl);
      formData.set("comprobantePathname", comprobantePathname);
    }
    startTransition(async () => {
      const res = inicial?.id
        ? await editarTransaccion(inicial.id, formData)
        : await crearTransaccion(formData);
      if (res.ok) {
        router.push("/transacciones");
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo guardar");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium mb-2">Tipo de movimiento</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cambiarTipo("ingreso")}
            className={`rounded-lg border-2 py-3 font-semibold transition-colors ${
              tipo === "ingreso"
                ? "border-ingreso bg-ingreso-bg text-ingreso"
                : "border-border text-muted"
            }`}
          >
            ↓ Ingreso
            <span className="block text-xs font-normal">Dinero que entra</span>
          </button>
          <button
            type="button"
            onClick={() => cambiarTipo("egreso")}
            className={`rounded-lg border-2 py-3 font-semibold transition-colors ${
              tipo === "egreso"
                ? "border-egreso bg-egreso-bg text-egreso"
                : "border-border text-muted"
            }`}
          >
            ↑ Egreso
            <span className="block text-xs font-normal">Dinero que sale</span>
          </button>
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium mb-1">Categoría</label>
        <select
          name="categoriaId"
          required
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5"
        >
          <option value="">Selecciona una categoría…</option>
          {categoriasFiltradas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {categoriaSel && (
          <p className="mt-1.5 text-xs text-muted bg-background rounded-md px-3 py-2">
            💡 {categoriaSel.descripcionDummies}
          </p>
        )}
      </div>

      {/* Monto + Moneda */}
      <div>
        <label className="block text-sm font-medium mb-1">Monto</label>
        <div className="flex gap-2">
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as "COP" | "USD")}
            className="rounded-lg border border-border bg-surface px-3 py-2.5"
          >
            <option value="COP">COP</option>
            <option value="USD">USD</option>
          </select>
          <input
            name="montoOriginal"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            defaultValue={inicial?.montoOriginal ?? ""}
            placeholder="0"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5"
          />
        </div>
      </div>

      {/* Tasa de cambio (solo USD) */}
      {moneda === "USD" && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Tasa de cambio (COP por 1 USD)
          </label>
          <input
            name="tasaCambio"
            type="number"
            inputMode="decimal"
            step="0.0001"
            min="0"
            required
            defaultValue={inicial?.tasaCambio ?? ""}
            placeholder="Ej. 4050"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5"
          />
          <p className="mt-1 text-xs text-muted">
            Se guarda el monto en USD y su equivalente en COP para los reportes.
          </p>
        </div>
      )}
      {moneda === "COP" && <input type="hidden" name="tasaCambio" value="1" />}

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium mb-1">Fecha</label>
        <input
          name="fecha"
          type="date"
          required
          defaultValue={inicial?.fecha ?? hoy}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5"
        />
      </div>

      {/* Cliente */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Cliente / Proyecto{" "}
          <span className="text-muted font-normal">
            {clienteSugerido ? "(recomendado)" : "(opcional)"}
          </span>
        </label>
        <select
          name="clienteId"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5"
        >
          <option value="">Sin cliente asociado</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <input
          name="descripcion"
          type="text"
          required
          maxLength={280}
          defaultValue={inicial?.descripcion ?? ""}
          placeholder="Ej. Anticipo proyecto DORU - mes 1"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5"
        />
      </div>

      {/* Método de pago */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Método de pago <span className="text-muted font-normal">(opcional)</span>
        </label>
        <select
          name="metodoPago"
          defaultValue={inicial?.metodoPago ?? ""}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5"
        >
          <option value="">No especificado</option>
          <option value="transferencia">Transferencia</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Comprobante */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Comprobante <span className="text-muted font-normal">(opcional)</span>
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          capture="environment"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) subirComprobante(f);
          }}
          className="w-full text-sm"
        />
        {subiendo && <p className="text-xs text-muted mt-1">Subiendo…</p>}
        {comprobanteUrl && !subiendo && (
          <p className="text-xs text-ingreso mt-1">✓ Comprobante adjuntado</p>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-egreso-bg text-egreso text-sm px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-border py-3 font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending || subiendo}
          className="flex-1 rounded-lg bg-accent text-white py-3 font-medium disabled:opacity-50"
        >
          {pending ? "Guardando…" : inicial?.id ? "Guardar cambios" : "Registrar"}
        </button>
      </div>
    </form>
  );
}
