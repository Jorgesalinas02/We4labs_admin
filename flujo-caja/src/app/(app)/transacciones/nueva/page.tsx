import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { listarCategoriasArbol, listarClientes, obtenerConfig } from "@/lib/queries";
import { hoyISO } from "@/lib/dates";
import { TransaccionForm } from "@/components/TransaccionForm";

export const dynamic = "force-dynamic";

export default async function NuevaTransaccionPage() {
  const usuario = await obtenerUsuarioActual();
  if (usuario?.rol !== "admin") redirect("/");

  const [arbol, clientes, cfg] = await Promise.all([
    listarCategoriasArbol(),
    listarClientes(),
    obtenerConfig(),
  ]);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-semibold mb-4">Nueva transacción</h1>
      <TransaccionForm
        arbol={arbol}
        clientes={clientes.filter((c) => c.estado === "activo")}
        hoy={hoyISO()}
        prefs={{
          monedaPorDefecto: cfg.monedaPorDefecto,
          tasaCambioSugerida: cfg.tasaCambioSugerida,
          requerirComprobante: cfg.requerirComprobante,
        }}
      />
    </div>
  );
}
