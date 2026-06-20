import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-brand">Flujo de Caja · We4Labs</h1>
        <p className="text-muted mt-1 text-sm">
          Acceso exclusivo para los founders
        </p>
      </div>
      <SignIn />
    </main>
  );
}
