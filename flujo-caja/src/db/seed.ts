import "dotenv/config";
import { db } from "./index";
import { categorias, config } from "./schema";
import { categoriasPredefinidas } from "./seed-data";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("→ Verificando categorías existentes...");
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(categorias);

  if (n > 0) {
    console.log(`  Ya hay ${n} categorías; no se vuelve a sembrar.`);
  } else {
    console.log("→ Sembrando categorías predefinidas...");
    await db.insert(categorias).values(categoriasPredefinidas);
    console.log(`  ${categoriasPredefinidas.length} categorías creadas.`);
  }

  console.log("→ Inicializando configuración (fila única)...");
  await db
    .insert(config)
    .values({
      id: 1,
      saldoInicialCop: "0",
      saldoInicialFecha: null,
      umbralAlertaCop: "0",
      zonaHoraria: "America/Bogota",
    })
    .onConflictDoNothing();

  console.log("✓ Seed completado.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("✗ Error en seed:", err);
  process.exit(1);
});
