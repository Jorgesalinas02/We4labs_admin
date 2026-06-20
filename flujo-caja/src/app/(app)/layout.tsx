import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth";
import { AppNav, BotonNuevaTransaccion } from "@/components/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/sign-in");
  const esAdmin = usuario.rol === "admin";

  return (
    <>
      <AppNav esAdmin={esAdmin} />
      <main className="flex-1 mx-auto w-full max-w-5xl px-3 py-5 pb-24">
        {children}
      </main>
      <BotonNuevaTransaccion esAdmin={esAdmin} />
    </>
  );
}
