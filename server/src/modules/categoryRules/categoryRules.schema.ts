import { z } from "zod";
import { normalizeText } from "./categoryRules.matcher.js";

export const createCategoryRuleSchema = z.object({
  pattern: z
    .string()
    .transform(normalizeText)
    .pipe(z.string().min(2, "Vzor musí mať aspoň 2 znaky.").max(100, "Vzor môže mať najviac 100 znakov.")),
  categoryId: z.string().cuid("Neplatné ID kategórie."),
});

export type CreateCategoryRuleInput = z.infer<typeof createCategoryRuleSchema>;
