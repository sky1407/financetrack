import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, z } from "zod";
import { AppError } from "../utils/AppError.js";

/**
 * Zvaliduje query parametre podľa zod schémy a uloží spracované (typované)
 * dáta do `res.locals.query`, keďže `req.query` v Express type je read-only tvar.
 */
export function validateQuery<Schema extends ZodTypeAny>(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(AppError.badRequest(formatZodError(result.error.flatten().fieldErrors)));
      return;
    }
    res.locals.query = result.data as z.infer<Schema>;
    next();
  };
}

function formatZodError(fieldErrors: Record<string, string[] | undefined>): string {
  const firstEntry = Object.entries(fieldErrors).find(([, messages]) => messages && messages.length > 0);
  if (!firstEntry) return "Neplatné vstupné dáta.";
  const [field, messages] = firstEntry;
  return `${field}: ${messages![0]}`;
}
