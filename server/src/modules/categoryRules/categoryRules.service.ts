import { prisma } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";
import { UNCATEGORIZED } from "../categories/categories.constants.js";
import { matchCategory, type MatchableRule } from "./categoryRules.matcher.js";
import type { CreateCategoryRuleInput } from "./categoryRules.schema.js";

const ruleInclude = { category: { select: { id: true, name: true, type: true, color: true } } } as const;

export async function listRules(userId: string) {
  return prisma.categoryRule.findMany({ where: { userId }, include: ruleInclude, orderBy: { pattern: "asc" } });
}

/** All rules of a user in the shape the matcher needs. */
export async function loadMatchableRules(userId: string): Promise<MatchableRule[]> {
  const rules = await prisma.categoryRule.findMany({
    where: { userId },
    select: { pattern: true, categoryId: true, category: { select: { type: true } } },
  });
  return rules.map((r) => ({ pattern: r.pattern, categoryId: r.categoryId, categoryType: r.category.type }));
}

/**
 * Creates a rule, or re-points an existing rule with the same pattern (the user "re-teaching" it),
 * then recategorizes matching uncategorized transactions.
 */
export async function createRule(userId: string, input: CreateCategoryRuleInput) {
  const category = await prisma.category.findFirst({ where: { id: input.categoryId, userId } });
  if (!category) throw AppError.badRequest("Zvolená kategória neexistuje.");
  if (category.name === UNCATEGORIZED.name) throw AppError.badRequest("Pravidlo nemôže zaraďovať do „Nezaradené“.");

  const rule = await prisma.categoryRule.upsert({
    where: { userId_pattern: { userId, pattern: input.pattern } },
    create: { userId, pattern: input.pattern, categoryId: input.categoryId },
    update: { categoryId: input.categoryId },
    include: ruleInclude,
  });
  const recategorized = await applyRulesToUncategorized(userId);
  return { rule, recategorized };
}

export async function deleteRule(userId: string, ruleId: string) {
  const { count } = await prisma.categoryRule.deleteMany({ where: { id: ruleId, userId } });
  if (count === 0) throw AppError.notFound("Pravidlo sa nenašlo.");
}

/**
 * Moves uncategorized transactions to the category their best matching rule points to.
 * Manually categorized transactions are never touched. Matching runs in JS so it follows
 * exactly the same rules as categorization during import.
 * @returns number of transactions moved
 */
export async function applyRulesToUncategorized(userId: string): Promise<number> {
  const [rules, uncategorized] = await Promise.all([
    loadMatchableRules(userId),
    prisma.transaction.findMany({
      where: { userId, category: { name: UNCATEGORIZED.name } },
      select: { id: true, note: true, type: true },
    }),
  ]);
  if (rules.length === 0 || uncategorized.length === 0) return 0;

  const idsByCategory = new Map<string, string[]>();
  for (const t of uncategorized) {
    const categoryId = matchCategory(rules, t.note, t.type);
    if (categoryId) idsByCategory.set(categoryId, [...(idsByCategory.get(categoryId) ?? []), t.id]);
  }

  const results = await prisma.$transaction(
    [...idsByCategory].map(([categoryId, ids]) =>
      prisma.transaction.updateMany({ where: { id: { in: ids }, userId }, data: { categoryId } })
    )
  );
  return results.reduce((sum, r) => sum + r.count, 0);
}
