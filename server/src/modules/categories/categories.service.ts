import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema.js";

export async function listCategories(userId: string) {
  return prisma.category.findMany({ where: { userId }, orderBy: [{ type: "asc" }, { name: "asc" }] });
}

async function findOwnedCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw AppError.notFound("Kategória sa nenašla.");
  return category;
}

export async function createCategory(userId: string, input: CreateCategoryInput) {
  return prisma.category.create({ data: { ...input, userId } });
}

export async function updateCategory(userId: string, categoryId: string, input: UpdateCategoryInput) {
  await findOwnedCategory(userId, categoryId);
  return prisma.category.update({ where: { id: categoryId }, data: input });
}

export async function deleteCategory(userId: string, categoryId: string) {
  await findOwnedCategory(userId, categoryId);
  const usageCount = await prisma.transaction.count({ where: { categoryId } });
  if (usageCount > 0) {
    throw AppError.conflict("Kategória sa nedá zmazať, pretože sa používa v transakciách.");
  }
  // Budget.category has onDelete: Cascade, so related budgets are deleted automatically.
  await prisma.category.delete({ where: { id: categoryId } });
}
