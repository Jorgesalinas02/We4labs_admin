// Carga .env.local (y .env como fallback) ANTES de que se evalúe cualquier
// módulo que lea process.env (como ./index). Debe importarse primero.
import { config } from "dotenv";
config({ path: ".env.local" });
config();
