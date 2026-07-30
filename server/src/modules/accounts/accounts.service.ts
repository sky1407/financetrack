import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import type { CreateAccountInput, UpdateAccountInput } from "./accounts.schema.js";

/** Current balance = initial balance + income - expenses on that account. */
async function computeBalances(userId: string, accountIds: string[]): Promise<Map<string, Prisma.Decimal>> {
  if (accountIds.length === 0) return new Map();

  const grouped = await prisma.transaction.groupBy({
    by: ["accountId", "type"],
    where: { userId, accountId: { in: accountIds } },
    _sum: { amount: true },
  });

  const balances = new Map<string, Prisma.Decimal>();
  for (const row of grouped) {
    const signed =
      row.type === TransactionType.INCOME ? (row._sum.amount ?? new Prisma.Decimal(0)) : (row._sum.amount ?? new Prisma.Decimal(0)).negated();
    balances.set(row.accountId, (balances.get(row.accountId) ?? new Prisma.Decimal(0)).plus(signed));
  }
  return balances;
}

export async function listAccounts(userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  const balanceDeltas = await computeBalances(
    userId,
    accounts.map((a) => a.id)
  );

  return accounts.map((account) => ({
    ...account,
    currentBalance: account.initialBalance.plus(balanceDeltas.get(account.id) ?? new Prisma.Decimal(0)),
  }));
}

async function findOwnedAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw AppError.notFound("Účet sa nenašiel.");
  return account;
}

export async function createAccount(userId: string, input: CreateAccountInput) {
  const account = await prisma.account.create({ data: { ...input, userId } });
  // A freshly created account has no transactions yet, so balance = initial deposit.
  return { ...account, currentBalance: account.initialBalance };
}

export async function updateAccount(userId: string, accountId: string, input: UpdateAccountInput) {
  await findOwnedAccount(userId, accountId);
  const account = await prisma.account.update({ where: { id: accountId }, data: input });
  const balanceDeltas = await computeBalances(userId, [accountId]);
  return { ...account, currentBalance: account.initialBalance.plus(balanceDeltas.get(accountId) ?? new Prisma.Decimal(0)) };
}

export async function deleteAccount(userId: string, accountId: string) {
  await findOwnedAccount(userId, accountId);
  await prisma.account.delete({ where: { id: accountId } });
}
