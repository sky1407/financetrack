import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { isProduction } from "../config/env.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} neexistuje.`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: err.issues[0]?.message ?? "Neplatné vstupné dáta." });
    return;
  }

  if (isPayloadTooLarge(err)) {
    res.status(413).json({ error: "Požiadavka je príliš veľká." });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Záznam s týmito údajmi už existuje." });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Záznam sa nenašiel." });
      return;
    }
    if (err.code === "P2003") {
      res.status(409).json({ error: "Záznam sa nedá upraviť, pretože ho používajú iné dáta." });
      return;
    }
  }

  console.error("Unexpected error:", err);
  res.status(500).json({
    error: "Nastala neočakávaná chyba na serveri.",
    ...(isProduction ? {} : { detail: err instanceof Error ? err.message : String(err) }),
  });
}

/** Body parsers reject oversized bodies with this error type; it is a client error, not a server bug. */
function isPayloadTooLarge(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { type?: unknown }).type === "entity.too.large";
}
