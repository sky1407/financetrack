import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

/**
 * A single shared PrismaClient for the whole app. In dev mode we stash it
 * on `globalThis` so that `tsx watch` doesn't open a new connection on
 * every hot-reload.
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
