import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { transacciones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { obtenerUsuarioActual } from "@/lib/auth";
import { listarCategoriasArbol, listarClientes, obtenerConfig } from "@/lib/queries";
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

  const [arbol, clientes, cfg] = await Promise.all([
    listarCategoriasArbol(),
    listarClientes(),
    obtenerConfig(),
  ]);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-lg font-semibold mb-4">Editar transacción</h1>
      <TransaccionForm
        arbol={arbol}
        clientes={clientes.filter((c) => c.estado === "activo")}
        hoy={hoyISO()}
        prefs={{
          monedaPorDefecto: cfg.monedaPorDefecto,
          tasaCambioSugerida: cfg.tasaCambioSugerida,
          requerirComprobante: cfg.requerirComprobante,
        }}
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
          esRecurrente: t.esRecurrente,
          frecuencia: t.frecuencia,
        }}
      />
      <EliminarTransaccion id={t.id} />
    </div>
  );
}
