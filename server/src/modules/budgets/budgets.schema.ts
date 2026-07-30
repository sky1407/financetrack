import { z } from "zod";

export const createBudgetSchema = z.object({
  categoryId: z.string().cuid("Neplatné ID kategórie."),
  amount: z.coerce.number().positive("Suma rozpočtu musí byť kladné číslo."),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const updateBudgetSchema = z.object({
  amount: z.coerce.number().positive("Suma rozpočtu musí byť kladné číslo."),
});

export const listBudgetsQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type ListBudgetsQuery = z.infer<typeof listBudgetsQuerySchema>;
