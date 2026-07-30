import { Pencil, Trash2, Wallet, Landmark, CreditCard, PiggyBank, CircleDollarSign } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";
import type { Account } from "@/types";

const ACCOUNT_ICONS: Record<Account["type"], LucideIcon> = {
  CASH: Wallet,
  BANK: Landmark,
  CARD: CreditCard,
  SAVINGS: PiggyBank,
  OTHER: CircleDollarSign,
};

export function AccountCard({ account, onEdit, onDelete }: { account: Account; onEdit: () => void; onDelete: () => void }) {
  const Icon = ACCOUNT_ICONS[account.type];
  const balance = Number(account.currentBalance);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{account.name}</p>
            <p className="text-xs text-slate-500">{ACCOUNT_TYPE_LABELS[account.type]}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" className="!px-2" onClick={onEdit} aria-label="Upraviť účet">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="!px-2 text-red-600 hover:bg-red-50" onClick={onDelete} aria-label="Zmazať účet">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className={`text-2xl font-semibold ${balance < 0 ? "text-red-600" : "text-slate-900"}`}>
        {formatCurrency(balance)}
      </p>
    </Card>
  );
}
