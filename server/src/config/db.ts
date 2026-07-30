import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

/**
 * Jeden zdieľaný PrismaClient pre celú aplikáciu. V dev móde ho ukladáme
 * na `globalThis`, aby `tsx watch` pri hot-reloade nevytváral nové
 * pripojenia pri každej zmene súboru.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__prisma__ ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
