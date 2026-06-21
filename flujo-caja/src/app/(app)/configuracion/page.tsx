import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { obtenerConfig, listarObligaciones } from "@/lib/queries";
import { listarUsuarios, listarInvitaciones } from "@/lib/clerk-admin";
import { ConfigForm } from "@/components/ConfigForm";
import { ConfigTabs } from "@/components/ConfigTabs";
import { UsuariosManager } from "@/components/UsuariosManager";
import { ObligacionesManager } from "@/components/ObligacionesManager";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const usuario = await obtenerUsuarioActual();
  if (usuario?.rol !== "admin") redirect("/");

  const [cfg, obligaciones, usuarios, invitaciones] = await Promise.all([
    obtenerConfig(),
    listarObligaciones(),
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
              cajaMinimaCop: cfg.cajaMinimaCop,
              horizonteProyeccionSemanas: cfg.horizonteProyeccionSemanas,
              monedaPorDefecto: cfg.monedaPorDefecto,
              tasaCambioSugerida: cfg.tasaCambioSugerida,
              requerirComprobante: cfg.requerirComprobante,
              diasAlertaInactividad: cfg.diasAlertaInactividad,
            }}
          />
        }
        tributario={
          <ObligacionesManager
            obligaciones={obligaciones.map((o) => ({
              id: o.id,
              nombre: o.nombre,
              periodicidad: o.periodicidad,
              proximoVencimiento: o.proximoVencimiento,
              diasAnticipacion: o.diasAnticipacion,
              montoEstimadoCop: o.montoEstimadoCop,
              nota: o.nota,
              activa: o.activa,
            }))}
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
