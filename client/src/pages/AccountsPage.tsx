import { useState } from "react";
import { Plus } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccountForm, type AccountFormValues } from "@/components/accounts/AccountForm";
import { AccountCard } from "@/components/accounts/AccountCard";
import { getApiErrorMessage } from "@/api/client";
import type { Account } from "@/types";

export function AccountsPage() {
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreateForm() {
    setEditingAccount(null);
    setError(null);
    setIsFormOpen(true);
  }

  function openEditForm(account: Account) {
    setEditingAccount(account);
    setError(null);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: AccountFormValues) {
    setIsSaving(true);
    setError(null);
    try {
      if (editingAccount) {
        await updateAccount({ id: editingAccount.id, input: values });
      } else {
        await createAccount(values);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Uloženie účtu zlyhalo."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingAccount) return;
    setIsDeleting(true);
    try {
      await deleteAccount(deletingAccount.id);
      setDeletingAccount(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Zmazanie účtu zlyhalo."));
      setDeletingAccount(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Účty</h1>
        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4" />
          Pridať účet
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          title="Zatiaľ nemáš žiadny účet"
          description="Pridaj svoj prvý účet, napríklad bežný účet alebo hotovosť."
          action={<Button onClick={openCreateForm}>Pridať účet</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={() => openEditForm(account)}
              onDelete={() => setDeletingAccount(account)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingAccount ? "Upraviť účet" : "Nový účet"}>
        <AccountForm
          defaultValues={
            editingAccount
              ? {
                  name: editingAccount.name,
                  type: editingAccount.type,
                  currency: editingAccount.currency,
                  initialBalance: Number(editingAccount.initialBalance),
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={isSaving}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deletingAccount !== null}
        title="Zmazať účet"
        description={`Naozaj chceš zmazať účet "${deletingAccount?.name}"? Zmažú sa aj všetky jeho transakcie. Táto akcia sa nedá vrátiť späť.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingAccount(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
