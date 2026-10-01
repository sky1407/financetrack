import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Pagination, Transaction } from "@/types";

export function TransactionTable({
  transactions,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  if (transactions.length === 0) {
    return <EmptyState title="Žiadne transakcie" description="Skús zmeniť filtre alebo pridaj novú transakciu." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Dátum</th>
            <th className="px-4 py-3">Kategória</th>
            <th className="hidden px-4 py-3 sm:table-cell">Účet</th>
            <th className="px-4 py-3">Poznámka</th>
            <th className="px-4 py-3 text-right">Suma</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((transaction) => {
            const Icon = getCategoryIcon(transaction.category.icon);
            const isIncome = transaction.type === "INCOME";
            return (
              <tr key={transaction.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(transaction.date)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${transaction.category.color}1a`, color: transaction.category.color }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {transaction.category.name}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{transaction.account.name}</td>
                <td className="min-w-[140px] max-w-[220px] truncate px-4 py-3 text-slate-500">{transaction.note || "—"}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${isIncome ? "text-green-700" : "text-red-700"}`}>
                  {isIncome ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" className="!px-2" onClick={() => onEdit(transaction)} aria-label="Upraviť transakciu">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="!px-2 text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(transaction)}
                      aria-label="Zmazať transakciu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <span>
            Strana {pagination.page} z {pagination.totalPages} ({pagination.total} záznamov)
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              aria-label="Predchádzajúca strana"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              aria-label="Nasledujúca strana"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
