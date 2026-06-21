import "./load-env";
import { db } from "./index";
import { categorias, config, obligacionesTributarias } from "./schema";
import { categoriasMadre, obligacionesPredefinidas } from "./seed-data";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("→ Verificando categorías existentes...");
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(categorias);

  if (n > 0) {
    console.log(`  Ya hay ${n} categorías; no se vuelve a sembrar.`);
  } else {
    console.log("→ Sembrando categorías madre + subcategorías...");
    let orden = 0;
    let subs = 0;
    for (const madre of categoriasMadre) {
      const [creada] = await db
        .insert(categorias)
        .values({
          nombre: madre.nombre,
          tipo: madre.tipo,
          categoriaMadreId: null,
          pideCliente: madre.pideCliente,
          esCostoDirecto: madre.esCostoDirecto ?? false,
          descripcionDummies: "",
          orden: orden++,
        })
        .returning({ id: categorias.id });

      let ordenSub = 0;
      for (const sub of madre.subs) {
        await db.insert(categorias).values({
          nombre: sub.nombre,
          tipo: madre.tipo,
          categoriaMadreId: creada.id,
          pideCliente: madre.pideCliente,
          esCostoDirecto: madre.esCostoDirecto ?? false,
          descripcionDummies: sub.descripcion,
          orden: ordenSub++,
        });
        subs++;
      }
    }
    console.log(`  ${categoriasMadre.length} madres y ${subs} subcategorías creadas.`);
  }

  console.log("→ Verificando obligaciones tributarias...");
  const [{ m }] = await db
    .select({ m: sql<number>`count(*)::int` })
    .from(obligacionesTributarias);
  if (m > 0) {
    console.log(`  Ya hay ${m} obligaciones; no se vuelven a sembrar.`);
  } else {
    await db.insert(obligacionesTributarias).values(
      obligacionesPredefinidas.map((o) => ({
        nombre: o.nombre,
        periodicidad: o.periodicidad,
        nota: o.nota,
      })),
    );
    console.log(`  ${obligacionesPredefinidas.length} obligaciones creadas.`);
  }

  console.log("→ Inicializando configuración (fila única)...");
  await db.insert(config).values({ id: 1 }).onConflictDoNothing();

  console.log("✓ Seed completado.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("✗ Error en seed:", err);
  process.exit(1);
});
