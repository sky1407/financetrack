import { z } from "zod";

export const MAX_STATEMENT_BYTES = 2 * 1024 * 1024;

export const createImportQuerySchema = z.object({
  accountId: z.string().cuid("Neplatné ID účtu."),
  fileName: z.string().trim().min(1).max(255).default("vypis.csv"),
});

export const statementContentSchema = z
  .string({ invalid_type_error: "Pošli výpis ako CSV (Content-Type: text/csv)." })
  .refine((content) => content.trim().length > 0, "Súbor je prázdny.");

export type CreateImportQuery = z.infer<typeof createImportQuerySchema>;
