import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { listarCategorias, listarClientes } from "@/lib/queries";
import { hoyISO } from "@/lib/dates";
import { TransaccionForm } from "@/components/TransaccionForm";

export const dynamic = "force-dynamic";

export default async function NuevaTransaccionPage() {
  const usuario = await obtenerUsuarioActual();
  if (usuario?.rol !== "admin") redirect("/");

  const [categorias, clientes] = await Promise.all([
    listarCategorias(),
    listarClientes(),
  ]);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-semibold mb-4">Nueva transacción</h1>
      <TransaccionForm
        categorias={categorias}
        clientes={clientes.filter((c) => c.estado === "activo")}
        hoy={hoyISO()}
      />
    </div>
  );
}
