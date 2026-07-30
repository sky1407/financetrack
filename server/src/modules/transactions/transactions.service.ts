import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateTransactionInput, ListTransactionsQuery, UpdateTransactionInput } from "./transactions.schema.js";

/** Overí, že účet aj kategória patria danému používateľovi a typy sú konzistentné. */
async function assertValidReferences(
  userId: string,
  accountId: string,
  categoryId: string,
  type: CreateTransactionInput["type"]
): Promise<void> {
  const [account, category] = await Promise.all([
    prisma.account.findFirst({ where: { id: accountId, userId } }),
    prisma.category.findFirst({ where: { id: categoryId, userId } }),
  ]);
  if (!account) throw AppError.badRequest("Zvolený účet neexistuje.");
  if (!category) throw AppError.badRequest("Zvolená kategória neexistuje.");
  if (category.type !== type) {
    throw AppError.badRequest(`Kategória "${category.name}" nezodpovedá typu transakcie (${type}).`);
  }
}

export async function listTransactions(userId: string, query: ListTransactionsQuery) {
  const where: Prisma.TransactionWhereInput = {
    userId,
    ...(query.accountId ? { accountId: query.accountId } : {}),
    ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.search ? { note: { contains: query.search, mode: "insensitive" } } : {}),
    ...(query.dateFrom || query.dateTo
      ? {
          date: {
            ...(query.dateFrom ? { gte: query.dateFrom } : {}),
            ...(query.dateTo ? { lte: query.dateTo } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { date: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    },
  };
}

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  await assertValidReferences(userId, input.accountId, input.categoryId, input.type);
  return prisma.transaction.create({
    data: { ...input, userId },
    include: { account: true, category: true },
  });
}

async function findOwnedTransaction(userId: string, transactionId: string) {
  const transaction = await prisma.transaction.findFirst({ where: { id: transactionId, userId } });
  if (!transaction) throw AppError.notFound("Transakcia sa nenašla.");
  return transaction;
}

export async function updateTransaction(userId: string, transactionId: string, input: UpdateTransactionInput) {
  const existing = await findOwnedTransaction(userId, transactionId);

  const accountId = input.accountId ?? existing.accountId;
  const categoryId = input.categoryId ?? existing.categoryId;
  const type = input.type ?? existing.type;
  await assertValidReferences(userId, accountId, categoryId, type);

  return prisma.transaction.update({
    where: { id: transactionId },
    data: input,
    include: { account: true, category: true },
  });
}

export async function deleteTransaction(userId: string, transactionId: string) {
  await findOwnedTransaction(userId, transactionId);
  await prisma.transaction.delete({ where: { id: transactionId } });
}
