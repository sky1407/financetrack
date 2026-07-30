import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { formatCurrency } from "@/lib/format";
import type { Budget } from "@/types";

export function BudgetCard({ budget, onEdit, onDelete }: { budget: Budget; onEdit: () => void; onDelete: () => void }) {
  const Icon = getCategoryIcon(budget.category.icon);
  const isOver = budget.percentage >= 100;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${budget.category.color}1a`, color: budget.category.color }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <p className="font-medium text-slate-900">{budget.category.name}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" className="!px-2" onClick={onEdit} aria-label="Upraviť rozpočet">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="!px-2 text-red-600 hover:bg-red-50" onClick={onDelete} aria-label="Zmazať rozpočet">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ProgressBar percentage={budget.percentage} color={budget.category.color} />

      <div className="flex items-center justify-between text-sm">
        <span className={isOver ? "font-medium text-red-600" : "text-slate-600"}>
          {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
        </span>
        <span className="text-slate-400">{Math.round(budget.percentage)} %</span>
      </div>
    </Card>
  );
}
