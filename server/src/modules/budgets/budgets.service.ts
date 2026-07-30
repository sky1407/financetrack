import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateBudgetInput, ListBudgetsQuery, UpdateBudgetInput } from "./budgets.schema.js";

function monthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

export async function listBudgets(userId: string, query: ListBudgetsQuery) {
  const now = new Date();
  const month = query.month ?? now.getMonth() + 1;
  const year = query.year ?? now.getFullYear();
  const { start, end } = monthRange(year, month);

  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
    orderBy: { category: { name: "asc" } },
  });

  const spentByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type: TransactionType.EXPENSE,
      date: { gte: start, lt: end },
      categoryId: { in: budgets.map((b) => b.categoryId) },
    },
    _sum: { amount: true },
  });
  const spentMap = new Map(spentByCategory.map((row) => [row.categoryId, row._sum.amount ?? new Prisma.Decimal(0)]));

  return budgets.map((budget) => withProgress(budget, spentMap.get(budget.categoryId) ?? new Prisma.Decimal(0)));
}

async function assertOwnedCategory(userId: string, categoryId: string): Promise<void> {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw AppError.badRequest("Zvolená kategória neexistuje.");
  if (category.type !== "EXPENSE") {
    throw AppError.badRequest("Rozpočet je možné nastaviť len pre výdavkové kategórie.");
  }
}

/** Sum of expenses in the given category for the given month (used to compute spent/remaining/percentage). */
async function computeSpent(userId: string, categoryId: string, month: number, year: number): Promise<Prisma.Decimal> {
  const { start, end } = monthRange(year, month);
  const result = await prisma.transaction.aggregate({
    where: { userId, categoryId, type: TransactionType.EXPENSE, date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? new Prisma.Decimal(0);
}

function withProgress<T extends { amount: Prisma.Decimal }>(budget: T, spent: Prisma.Decimal) {
  const percentage = budget.amount.isZero() ? 0 : Math.min(999, spent.dividedBy(budget.amount).times(100).toNumber());
  return { ...budget, spent, remaining: budget.amount.minus(spent), percentage };
}

export async function createBudget(userId: string, input: CreateBudgetInput) {
  await assertOwnedCategory(userId, input.categoryId);
  const budget = await prisma.budget.create({ data: { ...input, userId }, include: { category: true } });
  const spent = await computeSpent(userId, budget.categoryId, budget.month, budget.year);
  return withProgress(budget, spent);
}

async function findOwnedBudget(userId: string, budgetId: string) {
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) throw AppError.notFound("Rozpočet sa nenašiel.");
  return budget;
}

export async function updateBudget(userId: string, budgetId: string, input: UpdateBudgetInput) {
  await findOwnedBudget(userId, budgetId);
  const budget = await prisma.budget.update({ where: { id: budgetId }, data: input, include: { category: true } });
  const spent = await computeSpent(userId, budget.categoryId, budget.month, budget.year);
  return withProgress(budget, spent);
}

export async function deleteBudget(userId: string, budgetId: string) {
  await findOwnedBudget(userId, budgetId);
  await prisma.budget.delete({ where: { id: budgetId } });
}
