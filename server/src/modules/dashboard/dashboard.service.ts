import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../../config/db.js";
import type { DashboardQuery } from "./dashboard.schema.js";

const TREND_MONTHS = 6;

function monthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export async function getDashboardSummary(userId: string, query: DashboardQuery) {
  const now = new Date();
  const month = query.month ?? now.getMonth() + 1;
  const year = query.year ?? now.getFullYear();
  const { start: monthStart, end: monthEnd } = monthRange(year, month);

  const trendStart = new Date(year, month - 1 - (TREND_MONTHS - 1), 1);

  const [accounts, monthTransactions, trendTransactions] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: trendStart, lt: monthEnd } },
      select: { type: true, amount: true, date: true },
    }),
  ]);

  // Celkovy zostatok = pociatocne zostatky uctov + vsetky ich transakcie (nie len tento mesiac).
  const allTimeGrouped = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId },
    _sum: { amount: true },
  });
  const initialBalanceSum = accounts.reduce((sum, a) => sum.plus(a.initialBalance), new Prisma.Decimal(0));
  const totalIncomeAllTime = allTimeGrouped.find((g) => g.type === TransactionType.INCOME)?._sum.amount ?? new Prisma.Decimal(0);
  const totalExpenseAllTime = allTimeGrouped.find((g) => g.type === TransactionType.EXPENSE)?._sum.amount ?? new Prisma.Decimal(0);
  const totalBalance = initialBalanceSum.plus(totalIncomeAllTime).minus(totalExpenseAllTime);

  let monthlyIncome = new Prisma.Decimal(0);
  let monthlyExpense = new Prisma.Decimal(0);
  const spendingByCategory = new Map<string, { name: string; color: string; amount: Prisma.Decimal }>();

  for (const tx of monthTransactions) {
    if (tx.type === TransactionType.INCOME) {
      monthlyIncome = monthlyIncome.plus(tx.amount);
    } else {
      monthlyExpense = monthlyExpense.plus(tx.amount);
      const key = tx.categoryId;
      const existing = spendingByCategory.get(key);
      spendingByCategory.set(key, {
        name: tx.category.name,
        color: tx.category.color,
        amount: (existing?.amount ?? new Prisma.Decimal(0)).plus(tx.amount),
      });
    }
  }

  const trendBuckets = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal }>();
  for (let i = TREND_MONTHS - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    trendBuckets.set(monthKey(d.getFullYear(), d.getMonth() + 1), { income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) });
  }
  for (const tx of trendTransactions) {
    const key = monthKey(tx.date.getFullYear(), tx.date.getMonth() + 1);
    const bucket = trendBuckets.get(key);
    if (!bucket) continue;
    if (tx.type === TransactionType.INCOME) bucket.income = bucket.income.plus(tx.amount);
    else bucket.expense = bucket.expense.plus(tx.amount);
  }

  return {
    month,
    year,
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    monthlyNet: monthlyIncome.minus(monthlyExpense),
    accountsCount: accounts.length,
    spendingByCategory: [...spendingByCategory.values()].sort((a, b) => b.amount.comparedTo(a.amount)),
    trend: [...trendBuckets.entries()].map(([key, value]) => ({
      month: key,
      income: value.income,
      expense: value.expense,
      net: value.income.minus(value.expense),
    })),
  };
}
