import { SignUp } from "@clerk/nextjs";

// Esta pantalla solo es útil al aceptar una invitación. Como Clerk está en modo
// restringido (solo correos invitados), nadie ajeno puede completar el registro.
export default function SignUpPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand">Flujo de Caja · We4Labs</h1>
        <p className="text-muted mt-1 text-sm">
          Completa tu registro con la invitación recibida
        </p>
      </div>
      <SignUp />
    </main>
  );
}
