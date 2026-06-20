import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL no está definida. Copia .env.example a .env.local y configura tu cadena de conexión de Neon.",
  );
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export { schema };
