import { NextRequest, NextResponse } from "next/server";
import { obtenerUsuarioActual } from "@/lib/auth";
import { listarTransacciones, type FiltrosTransaccion } from "@/lib/queries";

function csvCampo(v: unknown): string {
  const s = v == null ? "" : String(v);
  // Escapa comillas y envuelve si hay separadores.
  if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const p = req.nextUrl.searchParams;
  const tipo = p.get("tipo");
  const filtros: FiltrosTransaccion = {
    tipo: tipo === "ingreso" || tipo === "egreso" ? tipo : undefined,
    madreId: p.get("categoria") || undefined,
    clienteId: p.get("cliente") || undefined,
    desde: p.get("desde") || undefined,
    hasta: p.get("hasta") || undefined,
  };

  const filas = await listarTransacciones(filtros);

  const encabezado = [
    "Fecha",
    "Tipo",
    "Categoría madre",
    "Subcategoría",
    "Cliente",
    "Descripción",
    "Moneda",
    "Monto original",
    "Tasa cambio",
    "Monto COP",
    "Método de pago",
    "Recurrente",
  ];

  // Usa ; como separador (Excel en español lo prefiere) y BOM para acentos.
  const lineas = [encabezado.join(";")];
  for (const f of filas) {
    lineas.push(
      [
        f.fecha,
        f.tipo,
        f.madreNombre ?? "",
        f.categoriaNombre,
        f.clienteNombre ?? "",
        f.descripcion,
        f.moneda,
        f.montoOriginal,
        f.tasaCambio,
        f.montoCop,
        f.metodoPago ?? "",
        f.esRecurrente ? `Sí (${f.frecuencia ?? ""})` : "No",
      ]
        .map(csvCampo)
        .join(";"),
    );
  }

  const csv = "﻿" + lineas.join("\r\n");
  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transacciones-${fecha}.csv"`,
    },
  });
}
