import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { obtenerConfig } from "@/lib/queries";
import { ConfigForm } from "@/components/ConfigForm";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const usuario = await obtenerUsuarioActual();
  if (usuario?.rol !== "admin") redirect("/");

  const cfg = await obtenerConfig();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Configuración</h1>
      <ConfigForm
        inicial={{
          saldoInicialCop: cfg.saldoInicialCop,
          saldoInicialFecha: cfg.saldoInicialFecha,
          umbralAlertaCop: cfg.umbralAlertaCop,
        }}
      />
      <div className="rounded-xl bg-surface border border-border p-4 max-w-lg text-sm text-muted">
        <p className="font-medium text-foreground mb-1">Roles de usuario</p>
        Los founders se invitan y se les asigna rol (Admin / Visor) desde el panel de
        Clerk, en <code>publicMetadata.role</code>. Quien no tenga rol explícito entra
        como Visor (solo lectura).
      </div>
    </div>
  );
}
