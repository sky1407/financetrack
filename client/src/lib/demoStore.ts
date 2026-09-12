import type {
  Account,
  Budget,
  Category,
  CategoryType,
  DashboardSummary,
  Transaction,
  TransactionsPage,
  TransactionType,
} from "@/types";
import type { AccountInput } from "@/api/accounts";
import type { CategoryInput } from "@/api/categories";
import type { TransactionFilters, TransactionInput } from "@/api/transactions";
import type { BudgetInput } from "@/api/budgets";

/**
 * In-memory backend stand-in for demo mode. Mirrors the real API's shapes
 * and business rules (balance = initial + income - expenses, budget
 * spent/remaining/percentage, dashboard aggregation) so the UI behaves the
 * same as against the real server. Nothing here is persisted — a full page
 * reload reseeds fresh demo data, which is the desired behaviour for a
 * public, shared demo link.
 */

type StoredAccount = Omit<Account, "currentBalance">;
type StoredBudget = Omit<Budget, "category" | "spent" | "remaining" | "percentage">;
interface StoredTransaction {
  id: string;
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amount: string;
  note: string | null;
  date: string;
  createdAt: string;
}

let seedCounter = 0;
function nextId(prefix: string): string {
  seedCounter += 1;
  return `demo_${prefix}_${seedCounter}`;
}

function money(n: number): string {
  return n.toFixed(2);
}

// Deterministic PRNG so the seeded demo data looks the same on every load.
function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
function pick<T>(options: T[]): T {
  // options is always a non-empty literal array at every call site, so the index is always in range.
  return options[Math.floor(rand() * options.length)] as T;
}
function amountBetween(min: number, max: number): number {
  return Math.round((min + rand() * (max - min)) * 100) / 100;
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
function monthRange(year: number, month: number): { start: Date; end: Date } {
  return { start: new Date(year, month - 1, 1), end: new Date(year, month, 1) };
}

// ---- seed data ----

const CATEGORY_SEED: Array<{ id: string; name: string; type: CategoryType; color: string; icon: string }> = [
  { id: "demo_cat_byvanie", name: "Bývanie", type: "EXPENSE", color: "#f97316", icon: "home" },
  { id: "demo_cat_jedlo", name: "Jedlo", type: "EXPENSE", color: "#22c55e", icon: "utensils" },
  { id: "demo_cat_doprava", name: "Doprava", type: "EXPENSE", color: "#3b82f6", icon: "car" },
  { id: "demo_cat_zabava", name: "Zábava", type: "EXPENSE", color: "#a855f7", icon: "film" },
  { id: "demo_cat_zdravie", name: "Zdravie", type: "EXPENSE", color: "#ef4444", icon: "heart-pulse" },
  { id: "demo_cat_nakupy", name: "Nákupy", type: "EXPENSE", color: "#eab308", icon: "shopping-bag" },
  { id: "demo_cat_ucty", name: "Účty a služby", type: "EXPENSE", color: "#06b6d4", icon: "receipt" },
  { id: "demo_cat_ostatne_v", name: "Ostatné výdavky", type: "EXPENSE", color: "#64748b", icon: "tag" },
  { id: "demo_cat_mzda", name: "Mzda", type: "INCOME", color: "#16a34a", icon: "briefcase" },
  { id: "demo_cat_freelance", name: "Freelance", type: "INCOME", color: "#0ea5e9", icon: "laptop" },
  { id: "demo_cat_investicie", name: "Investície", type: "INCOME", color: "#8b5cf6", icon: "trending-up" },
  { id: "demo_cat_ostatne_p", name: "Ostatné príjmy", type: "INCOME", color: "#64748b", icon: "tag" },
];

const seedCreatedAt = new Date(Date.now() - 200 * 86_400_000).toISOString();

let categories: Category[] = CATEGORY_SEED.map((c) => ({ ...c, createdAt: seedCreatedAt }));

let accounts: StoredAccount[] = [
  { id: "demo_acc_bezny", name: "Bežný účet", type: "BANK", currency: "EUR", initialBalance: money(400), createdAt: seedCreatedAt },
  { id: "demo_acc_hotovost", name: "Hotovosť", type: "CASH", currency: "EUR", initialBalance: money(50), createdAt: seedCreatedAt },
  { id: "demo_acc_sporenie", name: "Sporiaci účet", type: "SAVINGS", currency: "EUR", initialBalance: money(2000), createdAt: seedCreatedAt },
];

let transactions: StoredTransaction[] = [];
let budgets: StoredBudget[] = [];

function categoryOf(categoryId: string): Category {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) throw new Error("Kategória sa nenašla.");
  return category;
}
function accountOf(accountId: string): StoredAccount {
  const account = accounts.find((a) => a.id === accountId);
  if (!account) throw new Error("Účet sa nenašiel.");
  return account;
}

function accountBalanceDelta(accountId: string): number {
  let delta = 0;
  for (const t of transactions) {
    if (t.accountId !== accountId) continue;
    delta += t.type === "INCOME" ? Number(t.amount) : -Number(t.amount);
  }
  return delta;
}
function toAccountDTO(account: StoredAccount): Account {
  return { ...account, currentBalance: money(Number(account.initialBalance) + accountBalanceDelta(account.id)) };
}
function hydrateTransaction(t: StoredTransaction): Transaction {
  return { ...t, account: toAccountDTO(accountOf(t.accountId)), category: categoryOf(t.categoryId) };
}
function withProgress(budget: StoredBudget): Budget {
  const { start, end } = monthRange(budget.year, budget.month);
  const spent = transactions
    .filter((t) => t.categoryId === budget.categoryId && t.type === "EXPENSE" && new Date(t.date) >= start && new Date(t.date) < end)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const amount = Number(budget.amount);
  const percentage = amount === 0 ? 0 : Math.min(999, (spent / amount) * 100);
  return { ...budget, category: categoryOf(budget.categoryId), spent: money(spent), remaining: money(amount - spent), percentage };
}

function seedTransactions(): void {
  const today = new Date();
  const MONTHS = 6;

  for (let m = MONTHS - 1; m >= 0; m--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const isCurrentMonth = m === 0;

    const add = (day: number, params: { accountId: string; categoryId: string; type: TransactionType; amount: number; note: string }) => {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, 12);
      if (isCurrentMonth && date > today) return; // don't seed future transactions in the current month
      transactions.push({
        id: nextId("tx"),
        accountId: params.accountId,
        categoryId: params.categoryId,
        type: params.type,
        amount: money(params.amount),
        note: params.note,
        date: date.toISOString(),
        createdAt: date.toISOString(),
      });
    };

    add(1, { accountId: "demo_acc_bezny", categoryId: "demo_cat_mzda", type: "INCOME", amount: amountBetween(1350, 1500), note: "Výplata" });
    if (rand() < 0.5) {
      add(pick([8, 14, 20]), {
        accountId: "demo_acc_bezny",
        categoryId: "demo_cat_freelance",
        type: "INCOME",
        amount: amountBetween(150, 500),
        note: "Freelance projekt",
      });
    }
    add(2, { accountId: "demo_acc_bezny", categoryId: "demo_cat_byvanie", type: "EXPENSE", amount: amountBetween(420, 480), note: "Nájom" });
    add(5, { accountId: "demo_acc_bezny", categoryId: "demo_cat_ucty", type: "EXPENSE", amount: amountBetween(70, 110), note: "Elektrina a internet" });
    for (const day of [3, 9, 16, 23]) {
      add(day, {
        accountId: pick(["demo_acc_bezny", "demo_acc_hotovost"]),
        categoryId: "demo_cat_jedlo",
        type: "EXPENSE",
        amount: amountBetween(18, 60),
        note: pick(["Lidl", "Tesco", "Kaufland", "Billa"]),
      });
    }
    add(6, { accountId: "demo_acc_hotovost", categoryId: "demo_cat_doprava", type: "EXPENSE", amount: amountBetween(20, 50), note: "MHD / palivo" });
    if (rand() < 0.8) {
      add(pick([10, 18, 25]), {
        accountId: "demo_acc_bezny",
        categoryId: "demo_cat_zabava",
        type: "EXPENSE",
        amount: amountBetween(15, 60),
        note: pick(["Kino", "Netflix", "Koncert", "Reštaurácia"]),
      });
    }
    if (rand() < 0.6) {
      add(pick([12, 19]), {
        accountId: "demo_acc_bezny",
        categoryId: "demo_cat_nakupy",
        type: "EXPENSE",
        amount: amountBetween(20, 120),
        note: pick(["Oblečenie", "Elektronika", "Drogéria"]),
      });
    }
    if (rand() < 0.3) {
      add(pick([7, 17]), { accountId: "demo_acc_bezny", categoryId: "demo_cat_zdravie", type: "EXPENSE", amount: amountBetween(15, 80), note: "Lekáreň" });
    }
    if (m === 3 && rand() < 0.5) {
      add(15, { accountId: "demo_acc_sporenie", categoryId: "demo_cat_investicie", type: "INCOME", amount: amountBetween(40, 90), note: "Výnos z investície" });
    }
  }
}

function seedBudgets(): void {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  budgets = [
    { id: nextId("bud"), categoryId: "demo_cat_byvanie", amount: money(500), month, year },
    { id: nextId("bud"), categoryId: "demo_cat_jedlo", amount: money(250), month, year },
    { id: nextId("bud"), categoryId: "demo_cat_zabava", amount: money(80), month, year },
    { id: nextId("bud"), categoryId: "demo_cat_nakupy", amount: money(150), month, year },
  ];
}

seedTransactions();
seedBudgets();

// ---- public API, mirrors client/src/api/*.ts one-to-one ----

export const demoStore = {
  listAccounts(): Account[] {
    return accounts.map(toAccountDTO);
  },
  createAccount(input: AccountInput): Account {
    const account: StoredAccount = {
      id: nextId("acc"),
      name: input.name,
      type: input.type,
      currency: input.currency,
      initialBalance: money(input.initialBalance),
      createdAt: new Date().toISOString(),
    };
    accounts.push(account);
    return toAccountDTO(account);
  },
  updateAccount(accountId: string, input: Partial<AccountInput>): Account {
    const account = accountOf(accountId);
    if (input.name !== undefined) account.name = input.name;
    if (input.type !== undefined) account.type = input.type;
    if (input.currency !== undefined) account.currency = input.currency;
    if (input.initialBalance !== undefined) account.initialBalance = money(input.initialBalance);
    return toAccountDTO(account);
  },
  deleteAccount(accountId: string): void {
    accountOf(accountId);
    if (transactions.some((t) => t.accountId === accountId)) {
      throw new Error("Účet nie je možné vymazať, pretože obsahuje transakcie.");
    }
    accounts = accounts.filter((a) => a.id !== accountId);
  },

  listCategories(): Category[] {
    return categories;
  },
  createCategory(input: CategoryInput): Category {
    const category: Category = { id: nextId("cat"), ...input, createdAt: new Date().toISOString() };
    categories.push(category);
    return category;
  },
  updateCategory(categoryId: string, input: Partial<Omit<CategoryInput, "type">>): Category {
    const category = categoryOf(categoryId);
    Object.assign(category, input);
    return category;
  },
  deleteCategory(categoryId: string): void {
    categoryOf(categoryId);
    if (transactions.some((t) => t.categoryId === categoryId)) {
      throw new Error("Kategóriu nie je možné vymazať, pretože sa používa v transakciách.");
    }
    categories = categories.filter((c) => c.id !== categoryId);
  },

  listTransactions(filters: TransactionFilters): TransactionsPage {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const search = filters.search?.toLowerCase();

    const filtered = transactions.filter((t) => {
      if (filters.accountId && t.accountId !== filters.accountId) return false;
      if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
      if (filters.type && t.type !== filters.type) return false;
      if (search && !(t.note ?? "").toLowerCase().includes(search)) return false;
      if (filters.dateFrom && new Date(t.date) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(t.date) > new Date(filters.dateTo)) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize).map(hydrateTransaction);

    return { items, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
  },
  createTransaction(input: TransactionInput): Transaction {
    const category = categoryOf(input.categoryId);
    accountOf(input.accountId);
    if (category.type !== input.type) {
      throw new Error(`Kategória "${category.name}" nezodpovedá typu transakcie (${input.type}).`);
    }
    const stored: StoredTransaction = {
      id: nextId("tx"),
      accountId: input.accountId,
      categoryId: input.categoryId,
      type: input.type,
      amount: money(input.amount),
      note: input.note ?? null,
      date: new Date(input.date).toISOString(),
      createdAt: new Date().toISOString(),
    };
    transactions.push(stored);
    return hydrateTransaction(stored);
  },
  updateTransaction(transactionId: string, input: Partial<TransactionInput>): Transaction {
    const stored = transactions.find((t) => t.id === transactionId);
    if (!stored) throw new Error("Transakcia sa nenašla.");

    const accountId = input.accountId ?? stored.accountId;
    const categoryId = input.categoryId ?? stored.categoryId;
    const type = input.type ?? stored.type;
    const category = categoryOf(categoryId);
    accountOf(accountId);
    if (category.type !== type) {
      throw new Error(`Kategória "${category.name}" nezodpovedá typu transakcie (${type}).`);
    }

    stored.accountId = accountId;
    stored.categoryId = categoryId;
    stored.type = type;
    if (input.amount !== undefined) stored.amount = money(input.amount);
    if (input.note !== undefined) stored.note = input.note ?? null;
    if (input.date !== undefined) stored.date = new Date(input.date).toISOString();
    return hydrateTransaction(stored);
  },
  deleteTransaction(transactionId: string): void {
    if (!transactions.some((t) => t.id === transactionId)) throw new Error("Transakcia sa nenašla.");
    transactions = transactions.filter((t) => t.id !== transactionId);
  },

  listBudgets(month: number, year: number): Budget[] {
    return budgets.filter((b) => b.month === month && b.year === year).map(withProgress);
  },
  createBudget(input: BudgetInput): Budget {
    const category = categoryOf(input.categoryId);
    if (category.type !== "EXPENSE") throw new Error("Rozpočet je možné nastaviť len pre výdavkové kategórie.");
    const budget: StoredBudget = { id: nextId("bud"), categoryId: input.categoryId, amount: money(input.amount), month: input.month, year: input.year };
    budgets.push(budget);
    return withProgress(budget);
  },
  updateBudget(budgetId: string, amount: number): Budget {
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) throw new Error("Rozpočet sa nenašiel.");
    budget.amount = money(amount);
    return withProgress(budget);
  },
  deleteBudget(budgetId: string): void {
    if (!budgets.some((b) => b.id === budgetId)) throw new Error("Rozpočet sa nenašiel.");
    budgets = budgets.filter((b) => b.id !== budgetId);
  },

  getDashboard(month: number, year: number): DashboardSummary {
    const TREND_MONTHS = 6;
    const { start: monthStart, end: monthEnd } = monthRange(year, month);
    const trendStart = new Date(year, month - 1 - (TREND_MONTHS - 1), 1);

    let totalBalance = accounts.reduce((sum, a) => sum + Number(a.initialBalance), 0);
    for (const t of transactions) totalBalance += t.type === "INCOME" ? Number(t.amount) : -Number(t.amount);

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const spendingByCategory = new Map<string, { name: string; color: string; amount: number }>();
    for (const t of transactions) {
      const date = new Date(t.date);
      if (date < monthStart || date >= monthEnd) continue;
      if (t.type === "INCOME") {
        monthlyIncome += Number(t.amount);
      } else {
        monthlyExpense += Number(t.amount);
        const category = categoryOf(t.categoryId);
        const existing = spendingByCategory.get(t.categoryId);
        spendingByCategory.set(t.categoryId, { name: category.name, color: category.color, amount: (existing?.amount ?? 0) + Number(t.amount) });
      }
    }

    const trendBuckets = new Map<string, { income: number; expense: number }>();
    for (let i = TREND_MONTHS - 1; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      trendBuckets.set(monthKey(d.getFullYear(), d.getMonth() + 1), { income: 0, expense: 0 });
    }
    for (const t of transactions) {
      const date = new Date(t.date);
      if (date < trendStart || date >= monthEnd) continue;
      const bucket = trendBuckets.get(monthKey(date.getFullYear(), date.getMonth() + 1));
      if (!bucket) continue;
      if (t.type === "INCOME") bucket.income += Number(t.amount);
      else bucket.expense += Number(t.amount);
    }

    return {
      month,
      year,
      totalBalance: money(totalBalance),
      monthlyIncome: money(monthlyIncome),
      monthlyExpense: money(monthlyExpense),
      monthlyNet: money(monthlyIncome - monthlyExpense),
      accountsCount: accounts.length,
      spendingByCategory: [...spendingByCategory.values()]
        .sort((a, b) => b.amount - a.amount)
        .map((c) => ({ name: c.name, color: c.color, amount: money(c.amount) })),
      trend: [...trendBuckets.entries()].map(([key, v]) => ({ month: key, income: money(v.income), expense: money(v.expense), net: money(v.income - v.expense) })),
    };
  },
};
