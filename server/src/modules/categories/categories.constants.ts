import { CategoryType } from "@prisma/client";

/** Default categories every new user gets upon registration. */
export const DEFAULT_CATEGORIES: Array<{ name: string; type: CategoryType; color: string; icon: string }> = [
  { name: "Bývanie", type: CategoryType.EXPENSE, color: "#f97316", icon: "home" },
  { name: "Jedlo", type: CategoryType.EXPENSE, color: "#22c55e", icon: "utensils" },
  { name: "Doprava", type: CategoryType.EXPENSE, color: "#3b82f6", icon: "car" },
  { name: "Zábava", type: CategoryType.EXPENSE, color: "#a855f7", icon: "film" },
  { name: "Zdravie", type: CategoryType.EXPENSE, color: "#ef4444", icon: "heart-pulse" },
  { name: "Nákupy", type: CategoryType.EXPENSE, color: "#eab308", icon: "shopping-bag" },
  { name: "Účty a služby", type: CategoryType.EXPENSE, color: "#06b6d4", icon: "receipt" },
  { name: "Ostatné výdavky", type: CategoryType.EXPENSE, color: "#64748b", icon: "tag" },
  { name: "Mzda", type: CategoryType.INCOME, color: "#16a34a", icon: "briefcase" },
  { name: "Freelance", type: CategoryType.INCOME, color: "#0ea5e9", icon: "laptop" },
  { name: "Investície", type: CategoryType.INCOME, color: "#8b5cf6", icon: "trending-up" },
  { name: "Ostatné príjmy", type: CategoryType.INCOME, color: "#64748b", icon: "tag" },
];

/** Fallback category for imported transactions no rule matched; created on demand per type. */
export const UNCATEGORIZED = { name: "Nezaradené", color: "#94a3b8", icon: "tag" } as const;
