/**
 * Seeds the database with a demo user, categories, accounts, transactions
 * for the last 5 months, and budgets for the current month. Run: `npm run seed`.
 */
import { PrismaClient, AccountType, CategoryType, TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@financetrack.app";
const DEMO_PASSWORD = "demo1234";

const EXPENSE_CATEGORIES = [
  { name: "Bývanie", color: "#f97316", icon: "home" },
  { name: "Jedlo", color: "#22c55e", icon: "utensils" },
  { name: "Doprava", color: "#3b82f6", icon: "car" },
  { name: "Zábava", color: "#a855f7", icon: "film" },
  { name: "Zdravie", color: "#ef4444", icon: "heart-pulse" },
  { name: "Nákupy", color: "#eab308", icon: "shopping-bag" },
  { name: "Účty a služby", color: "#06b6d4", icon: "receipt" },
  { name: "Ostatné výdavky", color: "#64748b", icon: "tag" },
];

const INCOME_CATEGORIES = [
  { name: "Mzda", color: "#16a34a", icon: "briefcase" },
  { name: "Freelance", color: "#0ea5e9", icon: "laptop" },
  { name: "Investície", color: "#8b5cf6", icon: "trending-up" },
  { name: "Ostatné príjmy", color: "#64748b", icon: "tag" },
];

/** Simple deterministic PRNG (mulberry32) so the seed produces the same data on every machine. */
function createRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const rng = createRng(42);

  await prisma.transaction.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.create({
    data: { name: "Demo Používateľ", email: DEMO_EMAIL, passwordHash },
  });

  const accounts = await Promise.all([
    prisma.account.create({
      data: { userId: user.id, name: "Bežný účet", type: AccountType.BANK, initialBalance: 1200 },
    }),
    prisma.account.create({
      data: { userId: user.id, name: "Hotovosť", type: AccountType.CASH, initialBalance: 80 },
    }),
    prisma.account.create({
      data: { userId: user.id, name: "Kreditná karta", type: AccountType.CARD, initialBalance: 0 },
    }),
  ]);

  const expenseCategories = await Promise.all(
    EXPENSE_CATEGORIES.map((c) =>
      prisma.category.create({ data: { userId: user.id, type: CategoryType.EXPENSE, ...c } })
    )
  );
  const incomeCategories = await Promise.all(
    INCOME_CATEGORIES.map((c) =>
      prisma.category.create({ data: { userId: user.id, type: CategoryType.INCOME, ...c } })
    )
  );

  const salaryCategory = incomeCategories[0]!;
  const now = new Date();

  // Salary on the 1st of each of the last 5 months
  for (let m = 4; m >= 0; m--) {
    const date = new Date(now.getFullYear(), now.getMonth() - m, 1, 9, 0, 0);
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: accounts[0]!.id,
        categoryId: salaryCategory.id,
        type: TransactionType.INCOME,
        amount: 1450 + Math.round(rng() * 150),
        note: "Výplata",
        date,
      },
    });
  }

  // Occasional freelance income
  for (let m = 4; m >= 0; m--) {
    if (rng() > 0.5) continue;
    const date = new Date(now.getFullYear(), now.getMonth() - m, 3 + Math.floor(rng() * 20));
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: accounts[0]!.id,
        categoryId: incomeCategories[1]!.id,
        type: TransactionType.INCOME,
        amount: 100 + Math.round(rng() * 400),
        note: "Freelance projekt",
        date,
      },
    });
  }

  const expenseNotes: Record<string, string[]> = {
    Bývanie: ["Nájom", "Elektrina", "Internet"],
    Jedlo: ["Nákup potravín", "Reštaurácia", "Kaviareň"],
    Doprava: ["MHD lístok", "Benzín", "Parkovanie"],
    Zábava: ["Kino", "Streamovacia služba", "Koncert"],
    Zdravie: ["Lekáreň", "Zubár", "Poistenie"],
    Nákupy: ["Oblečenie", "Elektronika", "Drogéria"],
    "Účty a služby": ["Telefón", "Poistenie", "Predplatné"],
    "Ostatné výdavky": ["Darček", "Rôzne"],
  };

  for (let m = 4; m >= 0; m--) {
    for (const category of expenseCategories) {
      const count = 2 + Math.floor(rng() * 4);
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(rng() * 27);
        const date = new Date(now.getFullYear(), now.getMonth() - m, day);
        const account = accounts[Math.floor(rng() * accounts.length)]!;
        const notes = expenseNotes[category.name] ?? ["Výdavok"];
        const note = notes[Math.floor(rng() * notes.length)]!;
        const baseAmount = category.name === "Bývanie" ? 250 : 15;
        const amount = baseAmount + Math.round(rng() * baseAmount * 2);

        await prisma.transaction.create({
          data: {
            userId: user.id,
            accountId: account.id,
            categoryId: category.id,
            type: TransactionType.EXPENSE,
            amount,
            note,
            date,
          },
        });
      }
    }
  }

  // Rozpocty pre aktualny mesiac
  const budgetAmounts: Record<string, number> = {
    Bývanie: 400,
    Jedlo: 300,
    Doprava: 100,
    Zábava: 80,
    Zdravie: 60,
    Nákupy: 120,
    "Účty a služby": 90,
    "Ostatné výdavky": 50,
  };
  await Promise.all(
    expenseCategories.map((category) =>
      prisma.budget.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          amount: budgetAmounts[category.name] ?? 100,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      })
    )
  );

  console.log("Seed complete.");
  console.log(`Demo login -> email: ${DEMO_EMAIL}, password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
