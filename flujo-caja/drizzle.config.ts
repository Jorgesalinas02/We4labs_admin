import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Next.js usa .env.local; lo cargamos para los comandos de drizzle-kit.
config({ path: ".env.local" });
config(); // fallback a .env si existe

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
