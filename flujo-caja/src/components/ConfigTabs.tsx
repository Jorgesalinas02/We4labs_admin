"use client";

import { useState } from "react";

type TabKey = "transacciones" | "tributario" | "usuarios";

export function ConfigTabs({
  transacciones,
  tributario,
  usuarios,
}: {
  transacciones: React.ReactNode;
  tributario: React.ReactNode;
  usuarios: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("transacciones");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "transacciones", label: "Transacciones" },
    { key: "tributario", label: "Tributario" },
    { key: "usuarios", label: "Usuarios" },
  ];

  const contenido =
    tab === "transacciones" ? transacciones : tab === "tributario" ? tributario : usuarios;

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{contenido}</div>
    </div>
  );
}
