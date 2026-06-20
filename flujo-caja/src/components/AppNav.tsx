"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const enlaces = [
  { href: "/", label: "Inicio" },
  { href: "/transacciones", label: "Transacciones" },
  { href: "/clientes", label: "Clientes" },
];

const enlacesAdmin = [
  { href: "/configuracion", label: "Configuración" },
  { href: "/auditoria", label: "Auditoría" },
];

export function AppNav({ esAdmin }: { esAdmin: boolean }) {
  const pathname = usePathname();
  const items = esAdmin ? [...enlaces, ...enlacesAdmin] : enlaces;

  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border">
      <nav className="mx-auto max-w-5xl flex items-center gap-1 px-3 h-14 overflow-x-auto">
        <span className="font-bold text-brand mr-2 whitespace-nowrap">We4Labs</span>
        {items.map((e) => {
          const activo =
            e.href === "/" ? pathname === "/" : pathname.startsWith(e.href);
          return (
            <Link
              key={e.href}
              href={e.href}
              className={`px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                activo
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-background"
              }`}
            >
              {e.label}
            </Link>
          );
        })}
        <div className="ml-auto pl-2">
          <UserButton />
        </div>
      </nav>
    </header>
  );
}

export function BotonNuevaTransaccion({ esAdmin }: { esAdmin: boolean }) {
  if (!esAdmin) return null;
  return (
    <Link
      href="/transacciones/nueva"
      className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-accent text-white px-5 py-3.5 shadow-lg shadow-accent/30 font-medium active:scale-95 transition-transform"
      aria-label="Nueva transacción"
    >
      <span className="text-xl leading-none">+</span>
      <span className="hidden sm:inline">Nueva transacción</span>
    </Link>
  );
}
