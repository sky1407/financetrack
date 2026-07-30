import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { CategoryForm, type CategoryFormValues } from "@/components/categories/CategoryForm";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { getApiErrorMessage } from "@/api/client";
import type { Category, CategoryType } from "@/types";

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-slate-700">{title}</h2>
      {categories.length === 0 ? (
        <p className="text-sm text-slate-400">Žiadne kategórie.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {categories.map((category) => {
            const Icon = getCategoryIcon(category.icon);
            return (
              <li key={category.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${category.color}1a`, color: category.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm text-slate-800">{category.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" className="!px-2" onClick={() => onEdit(category)} aria-label="Upraviť kategóriu">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="!px-2 text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(category)}
                    aria-label="Zmazať kategóriu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export function CategoriesPage() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useCategories();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>("EXPENSE");
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreateForm(type: CategoryType) {
    setEditingCategory(null);
    setNewCategoryType(type);
    setError(null);
    setIsFormOpen(true);
  }

  function openEditForm(category: Category) {
    setEditingCategory(category);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: CategoryFormValues) {
    setIsSaving(true);
    setError(null);
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, input: values });
      } else {
        await createCategory(values);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Uloženie kategórie zlyhalo."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Zmazanie kategórie zlyhalo."));
      setDeletingCategory(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.type === "INCOME");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Kategórie</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => openCreateForm("INCOME")}>
            <Plus className="h-4 w-4" />
            Príjmová kategória
          </Button>
          <Button onClick={() => openCreateForm("EXPENSE")}>
            <Plus className="h-4 w-4" />
            Výdavková kategória
          </Button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState title="Zatiaľ nemáš žiadne kategórie" description="Vytvor si vlastné kategórie príjmov a výdavkov." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CategoryGroup title="Výdavky" categories={expenseCategories} onEdit={openEditForm} onDelete={setDeletingCategory} />
          <CategoryGroup title="Príjmy" categories={incomeCategories} onEdit={openEditForm} onDelete={setDeletingCategory} />
        </div>
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingCategory ? "Upraviť kategóriu" : "Nová kategória"}>
        <CategoryForm
          defaultValues={editingCategory ?? { type: newCategoryType }}
          isTypeLocked={Boolean(editingCategory)}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={isSaving}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deletingCategory !== null}
        title="Zmazať kategóriu"
        description={`Naozaj chceš zmazať kategóriu "${deletingCategory?.name}"? Kategórie použité v transakciách nie je možné zmazať.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCategory(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
