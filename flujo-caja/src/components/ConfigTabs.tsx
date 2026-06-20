"use client";

import { useState } from "react";

type TabKey = "transacciones" | "usuarios";

export function ConfigTabs({
  transacciones,
  usuarios,
}: {
  transacciones: React.ReactNode;
  usuarios: React.ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("transacciones");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "transacciones", label: "Transacciones" },
    { key: "usuarios", label: "Usuarios" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === t.key
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{tab === "transacciones" ? transacciones : usuarios}</div>
    </div>
  );
}
