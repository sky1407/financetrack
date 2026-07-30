import { useState } from "react";
import { Plus } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionForm, type TransactionFormValues } from "@/components/transactions/TransactionForm";
import { getApiErrorMessage } from "@/api/client";
import { toDateInputValue } from "@/lib/format";
import type { TransactionFilters as Filters } from "@/api/transactions";
import type { Transaction } from "@/types";

export function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>({ page: 1, pageSize: 20 });
  const { page, isLoading, createTransaction, updateTransaction, deleteTransaction } = useTransactions(filters);
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreateForm() {
    setEditingTransaction(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEditForm(transaction: Transaction) {
    setEditingTransaction(transaction);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: TransactionFormValues) {
    setIsSaving(true);
    setError(null);
    try {
      if (editingTransaction) {
        await updateTransaction({ id: editingTransaction.id, input: values });
      } else {
        await createTransaction(values);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Uloženie transakcie zlyhalo."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingTransaction) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deletingTransaction.id);
      setDeletingTransaction(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Zmazanie transakcie zlyhalo."));
      setDeletingTransaction(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const canCreate = accounts.length > 0 && categories.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Transakcie</h1>
        <Button onClick={openCreateForm} disabled={!canCreate} title={canCreate ? undefined : "Najprv vytvor účet a kategóriu"}>
          <Plus className="h-4 w-4" />
          Pridať transakciu
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <TransactionFilters accounts={accounts} categories={categories} filters={filters} onChange={setFilters} />

      {isLoading || !page ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <TransactionTable
          transactions={page.items}
          pagination={page.pagination}
          onPageChange={(nextPage) => setFilters((f) => ({ ...f, page: nextPage }))}
          onEdit={openEditForm}
          onDelete={setDeletingTransaction}
        />
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingTransaction ? "Upraviť transakciu" : "Nová transakcia"}
      >
        <TransactionForm
          accounts={accounts}
          categories={categories}
          defaultValues={
            editingTransaction
              ? {
                  type: editingTransaction.type,
                  accountId: editingTransaction.accountId,
                  categoryId: editingTransaction.categoryId,
                  amount: Number(editingTransaction.amount),
                  date: toDateInputValue(editingTransaction.date),
                  note: editingTransaction.note ?? "",
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={isSaving}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deletingTransaction !== null}
        title="Zmazať transakciu"
        description="Naozaj chceš zmazať túto transakciu? Táto akcia sa nedá vrátiť späť."
        onConfirm={handleDelete}
        onCancel={() => setDeletingTransaction(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
