import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { obtenerConfig } from "@/lib/queries";
import { listarUsuarios, listarInvitaciones } from "@/lib/clerk-admin";
import { ConfigForm } from "@/components/ConfigForm";
import { ConfigTabs } from "@/components/ConfigTabs";
import { UsuariosManager } from "@/components/UsuariosManager";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const usuario = await obtenerUsuarioActual();
  if (usuario?.rol !== "admin") redirect("/");

  const [cfg, usuarios, invitaciones] = await Promise.all([
    obtenerConfig(),
    listarUsuarios(),
    listarInvitaciones(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Configuración</h1>
      <ConfigTabs
        transacciones={
          <ConfigForm
            inicial={{
              saldoInicialCop: cfg.saldoInicialCop,
              saldoInicialFecha: cfg.saldoInicialFecha,
              umbralAlertaCop: cfg.umbralAlertaCop,
              monedaPorDefecto: cfg.monedaPorDefecto,
              tasaCambioSugerida: cfg.tasaCambioSugerida,
              requerirComprobante: cfg.requerirComprobante,
              requerirClienteIngresos: cfg.requerirClienteIngresos,
              diasAlertaInactividad: cfg.diasAlertaInactividad,
            }}
          />
        }
        usuarios={
          <UsuariosManager
            usuarios={usuarios}
            invitaciones={invitaciones}
            yoId={usuario.clerkId}
          />
        }
      />
    </div>
  );
}
