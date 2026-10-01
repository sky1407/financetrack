import type { CategoryType, TransactionType } from "@/types";

/**
 * Client copy of the server matcher (server/src/modules/categoryRules/categoryRules.matcher.ts),
 * used by the backend-less demo. Keep both in sync.
 */
export interface MatchableRule {
  pattern: string;
  categoryId: string;
  categoryType: CategoryType;
}

export const UNCATEGORIZED_NAME = "Nezaradené";

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Longest pattern contained in the note wins; the category type must equal the transaction type. */
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
