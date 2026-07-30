import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL musí byť nastavené"),
  CLIENT_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET musí mať aspoň 16 znakov"),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Neplatná konfigurácia prostredia:", parsed.error.flatten().fieldErrors);
  throw new Error("Chýbajúce alebo neplatné premenné prostredia. Skontroluj .env súbor (viď .env.example).");
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
