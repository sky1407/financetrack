import { useState } from "react";
import { Plus } from "lucide-react";
import { useBudgets } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { MonthSwitcher } from "@/components/ui/MonthSwitcher";
import { BudgetForm, type BudgetFormValues } from "@/components/budgets/BudgetForm";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { getApiErrorMessage } from "@/api/client";
import type { Budget } from "@/types";

export function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { budgets, isLoading, createBudget, updateBudget, deleteBudget } = useBudgets(month, year);
  const { categories } = useCategories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter((c) => c.type === "EXPENSE" && !budgetedCategoryIds.has(c.id));

  function openCreateForm() {
    setEditingBudget(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEditForm(budget: Budget) {
    setEditingBudget(budget);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: BudgetFormValues) {
    setIsSaving(true);
    setError(null);
    try {
      if (editingBudget) {
        await updateBudget({ id: editingBudget.id, amount: values.amount });
      } else {
        await createBudget({ ...values, month, year });
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Uloženie rozpočtu zlyhalo."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingBudget) return;
    setIsDeleting(true);
    try {
      await deleteBudget(deletingBudget.id);
      setDeletingBudget(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Zmazanie rozpočtu zlyhalo."));
      setDeletingBudget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Rozpočty</h1>
        <div className="flex items-center gap-3">
          <MonthSwitcher month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
          <Button onClick={openCreateForm} disabled={availableCategories.length === 0}>
            <Plus className="h-4 w-4" />
            Pridať rozpočet
          </Button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : budgets.length === 0 ? (
        <EmptyState
          title="Zatiaľ nemáš nastavený žiadny rozpočet"
          description="Nastav si mesačný limit pre výdavkovú kategóriu a sleduj svoje míňanie."
          action={
            <Button onClick={openCreateForm} disabled={availableCategories.length === 0}>
              Pridať rozpočet
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} onEdit={() => openEditForm(budget)} onDelete={() => setDeletingBudget(budget)} />
          ))}
        </div>
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingBudget ? "Upraviť rozpočet" : "Nový rozpočet"}>
        <BudgetForm
          availableCategories={editingBudget ? [editingBudget.category] : availableCategories}
          isCategoryLocked={Boolean(editingBudget)}
          defaultValues={editingBudget ? { categoryId: editingBudget.categoryId, amount: Number(editingBudget.amount) } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={isSaving}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deletingBudget !== null}
        title="Zmazať rozpočet"
        description={`Naozaj chceš zmazať rozpočet pre kategóriu "${deletingBudget?.category.name}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingBudget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
