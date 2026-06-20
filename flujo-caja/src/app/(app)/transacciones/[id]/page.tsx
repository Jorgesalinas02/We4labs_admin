import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { transacciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { obtenerUsuarioActual } from "@/lib/auth";
import { listarCategorias, listarClientes } from "@/lib/queries";
import { hoyISO } from "@/lib/dates";
import { TransaccionForm } from "@/components/TransaccionForm";
import { EliminarTransaccion } from "@/components/EliminarTransaccion";

export const dynamic = "force-dynamic";

export default async function EditarTransaccionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await obtenerUsuarioActual();
  if (usuario?.rol !== "admin") redirect("/");

  const [t] = await db
    .select()
    .from(transacciones)
    .where(eq(transacciones.id, id))
    .limit(1);
  if (!t || t.estado === "eliminada") notFound();

  const [categorias, clientes] = await Promise.all([
    listarCategorias(),
    listarClientes(),
  ]);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-semibold mb-4">Editar transacción</h1>
      <TransaccionForm
        categorias={categorias}
        clientes={clientes.filter((c) => c.estado === "activo")}
        hoy={hoyISO()}
        inicial={{
          id: t.id,
          tipo: t.tipo,
          categoriaId: t.categoriaId,
          clienteId: t.clienteId,
          moneda: t.moneda,
          montoOriginal: t.montoOriginal,
          tasaCambio: t.tasaCambio,
          fecha: t.fecha,
          descripcion: t.descripcion,
          metodoPago: t.metodoPago,
          comprobanteUrl: t.comprobanteUrl,
          comprobantePathname: t.comprobantePathname,
        }}
      />
      <EliminarTransaccion id={t.id} />
    </div>
  );
}
