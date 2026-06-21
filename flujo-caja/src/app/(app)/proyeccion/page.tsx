import { obtenerUsuarioActual } from "@/lib/auth";
import { construirProyeccion } from "@/lib/proyeccion";
import { hoyISO } from "@/lib/dates";
import { ProyeccionVista } from "@/components/ProyeccionVista";

export const dynamic = "force-dynamic";

export default async function ProyeccionPage() {
  const usuario = await obtenerUsuarioActual();
  const esAdmin = usuario?.rol === "admin";
  const { semanas, cajaMinima } = await construirProyeccion();

  return (
    <ProyeccionVista
      semanas={semanas}
      cajaMinima={cajaMinima}
      esAdmin={esAdmin}
      hoy={hoyISO()}
    />
  );
}
