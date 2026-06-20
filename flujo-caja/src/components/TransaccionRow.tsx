import Link from "next/link";
import { formatMoneda, type Moneda } from "@/lib/money";

export interface TransaccionLista {
  id: string;
  tipo: "ingreso" | "egreso";
  moneda: string;
  montoOriginal: string;
  montoCop: string;
  fecha: string;
  descripcion: string;
  categoriaNombre: string;
  clienteNombre: string | null;
  comprobanteUrl: string | null;
}

export function TransaccionRow({
  t,
  href,
}: {
  t: TransaccionLista;
  href?: string;
}) {
  const esIngreso = t.tipo === "ingreso";
  const contenido = (
    <div className="flex items-center gap-3 py-3">
      <span
        className={`w-1.5 h-9 rounded-full ${esIngreso ? "bg-ingreso" : "bg-egreso"}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{t.descripcion}</p>
        <p className="text-xs text-muted truncate">
          {t.categoriaNombre}
          {t.clienteNombre ? ` · ${t.clienteNombre}` : ""} · {t.fecha}
          {t.comprobanteUrl ? " · 📎" : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold ${esIngreso ? "text-ingreso" : "text-egreso"}`}>
          {esIngreso ? "+" : "−"}
          {formatMoneda(t.montoCop)}
        </p>
        {t.moneda !== "COP" && (
          <p className="text-[11px] text-muted">
            {formatMoneda(t.montoOriginal, t.moneda as Moneda)}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <Link href={href} className="block hover:bg-background -mx-2 px-2 rounded-lg">
          {contenido}
        </Link>
      </li>
    );
  }
  return <li>{contenido}</li>;
}
