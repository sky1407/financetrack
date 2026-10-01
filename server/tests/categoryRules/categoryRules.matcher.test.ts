import { describe, expect, it } from "vitest";
import { matchCategory, normalizeText, type MatchableRule } from "../../src/modules/categoryRules/categoryRules.matcher.js";

const rules: MatchableRule[] = [
  { pattern: "bolt", categoryId: "transport", categoryType: "EXPENSE" },
  { pattern: "bolt food", categoryId: "food", categoryType: "EXPENSE" },
  { pattern: "výplata", categoryId: "salary", categoryType: "INCOME" },
];

describe("matchCategory", () => {
  it("matches case-insensitively as a substring", () => {
    expect(matchCategory(rules, "BOLT.EU/O/2603", "EXPENSE")).toBe("transport");
  });

  it("prefers the longest matching pattern", () => {
    expect(matchCategory(rules, "Bolt Food Bratislava", "EXPENSE")).toBe("food");
  });

  it("ignores rules whose category type differs from the transaction type", () => {
    expect(matchCategory(rules, "Bolt refund", "INCOME")).toBeNull();
  });

  it("handles diacritics and extra whitespace", () => {
    expect(matchCategory(rules, "  VÝPLATA   september ", "INCOME")).toBe("salary");
  });

  it("returns null without a note or a match", () => {
    expect(matchCategory(rules, null, "EXPENSE")).toBeNull();
    expect(matchCategory(rules, "Lidl", "EXPENSE")).toBeNull();
  });
});

describe("normalizeText", () => {
  it("lower-cases and collapses whitespace", () => {
    expect(normalizeText("  Bolt   FOOD ")).toBe("bolt food");
  });
});
