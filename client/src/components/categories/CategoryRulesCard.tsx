import { useState, type FormEvent } from "react";
import { Trash2, Wand2 } from "lucide-react";
import { useCategoryRules } from "@/hooks/useCategoryRules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { getApiErrorMessage } from "@/api/client";
import { UNCATEGORIZED_NAME } from "@/lib/categoryRules";
import type { Category } from "@/types";

/** Lists auto-categorization rules and lets the user add or remove them. */
export function CategoryRulesCard({ categories }: { categories: Category[] }) {
  const { rules, isLoading, createRule, deleteRule } = useCategoryRules();
  const targets = categories.filter((c) => c.name !== UNCATEGORIZED_NAME);
  const [pattern, setPattern] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const selectedCategoryId = categoryId || targets[0]?.id || "";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const { recategorized } = await createRule({ pattern, categoryId: selectedCategoryId });
      setPattern("");
      setMessage({ kind: "ok", text: `Pravidlo uložené. Zaradených transakcií: ${recategorized}.` });
    } catch (err) {
      setMessage({ kind: "error", text: getApiErrorMessage(err, "Uloženie pravidla zlyhalo.") });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setMessage(null);
    try {
      await deleteRule(id);
    } catch (err) {
      setMessage({ kind: "error", text: getApiErrorMessage(err, "Zmazanie pravidla zlyhalo.") });
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Wand2 className="h-4 w-4 text-brand-600" />
          Pravidlá automatickej kategorizácie
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Transakcia, ktorej popis obsahuje vzor, sa pri importe zaradí do zvolenej kategórie. Nové pravidlo zaradí aj
          existujúce „{UNCATEGORIZED_NAME}“ transakcie, ručne zaradené nemení.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end" noValidate>
        <div className="flex-1">
          <Input label="Popis obsahuje" name="pattern" placeholder="napr. bolt" value={pattern} onChange={(e) => setPattern(e.target.value)} />
        </div>
        <div className="flex-1">
          <Select label="Kategória" name="ruleCategory" value={selectedCategoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {targets.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === "EXPENSE" ? "výdavok" : "príjem"})
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" isLoading={isSaving} disabled={pattern.trim().length < 2 || !selectedCategoryId}>
          Pridať
        </Button>
      </form>

      {message && (
        <p className={`rounded-lg px-4 py-2 text-sm ${message.kind === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      {isLoading ? (
        <Spinner />
      ) : rules.length === 0 ? (
        <p className="text-sm text-slate-400">Zatiaľ žiadne pravidlá.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between gap-3 py-2">
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <code className="truncate rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{rule.pattern}</code>
                <span className="text-slate-400">→</span>
                <Badge color={rule.category.color}>{rule.category.name}</Badge>
              </span>
              <Button
                variant="ghost"
                className="!px-2 text-red-600 hover:bg-red-50"
                onClick={() => void handleDelete(rule.id)}
                aria-label={`Zmazať pravidlo ${rule.pattern}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
