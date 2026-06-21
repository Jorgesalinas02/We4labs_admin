import Link from "next/link";
import { formatMoneda } from "@/lib/money";

interface Item {
  id: string;
  tipo: "ingreso" | "egreso";
  descripcion: string;
  montoCop: string;
  fecha: string;
  madreNombre?: string | null;
  categoriaNombre: string;
  esRecurrente?: boolean;
}

export function HistorialPagos({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="text-muted text-sm">Todavía no hay transacciones registradas.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((t) => {
        const esIngreso = t.tipo === "ingreso";
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                esIngreso
                  ? "bg-ingreso-bg text-ingreso"
                  : "bg-egreso-bg text-egreso"
              }`}
            >
              {esIngreso ? "↓" : "↑"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{t.descripcion}</p>
              <p className="text-xs text-muted truncate">
                {t.madreNombre ?? t.categoriaNombre}
                {t.esRecurrente ? " · 🔁" : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold ${esIngreso ? "text-ingreso" : "text-egreso"}`}>
                {esIngreso ? "+" : "−"}
                {formatMoneda(t.montoCop)}
              </p>
              <p className="text-[11px] text-muted">{t.fecha}</p>
            </div>
          </li>
        );
      })}
      <li className="pt-3">
        <Link href="/transacciones" className="text-accent text-sm hover:underline">
          Ver todas →
        </Link>
      </li>
    </ul>
  );
}
