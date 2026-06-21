import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Inicialización perezosa: el cliente de Neon NO se crea al importar el módulo,
// sino en el primer uso real. Así el build (que evalúa los módulos de las rutas
// para recolectar metadatos) no falla si DATABASE_URL no está disponible en ese
// momento; la conexión solo se necesita en tiempo de ejecución.
let _db: NeonHttpDatabase<typeof schema> | null = null;

function init(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Configúrala en las variables de entorno.",
    );
  }
  _db = drizzle(neon(connectionString), { schema });
  return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    const real = init();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export { schema };
