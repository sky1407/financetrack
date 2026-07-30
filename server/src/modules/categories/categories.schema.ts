import { z } from "zod";
import { CategoryType } from "@prisma/client";

const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Farba musí byť v hex tvare, napr. #22c55e.");

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Názov kategórie je povinný.").max(40),
  type: z.nativeEnum(CategoryType),
  color: hexColor.default("#64748b"),
  icon: z.string().trim().min(1).max(40).default("tag"),
});

export const updateCategorySchema = createCategorySchema.partial().omit({ type: true });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
