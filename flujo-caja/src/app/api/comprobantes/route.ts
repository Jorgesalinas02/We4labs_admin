import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { obtenerUsuarioActual } from "@/lib/auth";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (usuario.rol !== "admin") {
    return NextResponse.json({ error: "Requiere rol de administrador" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return NextResponse.json(
      { error: "Solo se permiten imágenes (JPG/PNG) o PDF" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "El archivo supera el límite de 10 MB" },
      { status: 400 },
    );
  }

  const nombre = `comprobantes/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  // Acceso público a nivel de Blob pero con URL aleatoria no enumerable.
  // (El listado y descarga se controlan desde la app, no se exponen URLs.)
  const blob = await put(nombre, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return NextResponse.json({ url: blob.url, pathname: blob.pathname });
}
