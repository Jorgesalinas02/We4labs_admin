import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Next.js 16 renombró "middleware" a "proxy". Aquí va la protección de Clerk:
// todo requiere sesión salvo la pantalla de login y los webhooks.
const esRutaPublica = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!esRutaPublica(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Salta archivos estáticos e internos de Next, ejecuta en todo lo demás.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
