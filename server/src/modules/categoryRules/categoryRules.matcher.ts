import type { CategoryType, TransactionType } from "@prisma/client";

export interface MatchableRule {
  /** Normalized with `normalizeText`. */
  pattern: string;
  categoryId: string;
  categoryType: CategoryType;
}

/** Lower-cases and collapses whitespace so patterns and notes compare consistently. */
export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Returns the category of the rule whose pattern occurs in the note, or null.
 * Only rules whose category type equals the transaction type apply (a refund from a merchant
 * must not land in its expense category); with several matches the longest, most specific pattern wins.
 */
export function matchCategory(rules: readonly MatchableRule[], note: string | null, type: TransactionType): string | null {
  if (!note) return null;
  const text = normalizeText(note);
  let best: MatchableRule | null = null;
  for (const rule of rules) {
    if (rule.categoryType !== type || !text.includes(rule.pattern)) continue;
    if (!best || rule.pattern.length > best.pattern.length) best = rule;
  }
  return best?.categoryId ?? null;
}
