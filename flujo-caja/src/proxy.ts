import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Next.js 16 renombró "middleware" a "proxy". Aquí va la protección de Clerk:
// todo requiere sesión salvo la pantalla de login y los webhooks.
const esRutaPublica = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (esRutaPublica(req)) return;

  const { userId } = await auth();
  if (!userId) {
    // Redirección manual y explícita al login (evita el 404 de auth.protect()
    // con instancias de desarrollo de Clerk en dominios desplegados).
    const url = new URL("/sign-in", req.url);
    url.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    // Salta archivos estáticos e internos de Next, ejecuta en todo lo demás.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
