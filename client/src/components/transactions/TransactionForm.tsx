import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { toDateInputValue } from "@/lib/format";
import type { Account, Category } from "@/types";

const transactionFormSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    accountId: z.string().min(1, "Zvoľ účet."),
    categoryId: z.string().min(1, "Zvoľ kategóriu."),
    amount: z.coerce.number({ invalid_type_error: "Zadaj sumu." }).positive("Suma musí byť kladné číslo."),
    date: z.string().min(1, "Zvoľ dátum."),
    note: z.string().max(200).optional(),
    /** When set, the page also saves a categorization rule "note contains rulePattern → categoryId". */
    rememberRule: z.boolean().default(false),
    rulePattern: z.string().max(100, "Vzor môže mať najviac 100 znakov.").optional(),
  })
  .refine((v) => !v.rememberRule || (v.rulePattern ?? "").trim().length >= 2, {
    message: "Vzor musí mať aspoň 2 znaky.",
    path: ["rulePattern"],
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function TransactionForm({
  accounts,
  categories,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  canRememberRule = false,
}: {
  accounts: Account[];
  categories: Category[];
  defaultValues?: Partial<TransactionFormValues>;
  onSubmit: (values: TransactionFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** Offer "remember for similar transactions" (edit mode of a transaction with a note). */
  canRememberRule?: boolean;
}) {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: "EXPENSE",
      accountId: accounts[0]?.id ?? "",
      categoryId: "",
      amount: 0,
      date: toDateInputValue(new Date()),
      rememberRule: false,
      ...defaultValues,
      rulePattern: defaultValues?.rulePattern ?? defaultValues?.note ?? "",
    },
  });

  const selectedType = watch("type");
  const rememberRule = watch("rememberRule");
  const categoriesForType = categories.filter((c) => c.type === selectedType);

  useEffect(() => {
    if (!categoriesForType.some((c) => c.id === watch("categoryId"))) {
      setValue("categoryId", categoriesForType[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Select label="Typ" error={errors.type?.message} {...register("type")}>
        <option value="EXPENSE">Výdavok</option>
        <option value="INCOME">Príjem</option>
      </Select>

      <Select label="Účet" error={errors.accountId?.message} {...register("accountId")}>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </Select>

      <Select label="Kategória" error={errors.categoryId?.message} {...register("categoryId")}>
        {categoriesForType.length === 0 && <option value="">Najprv vytvor kategóriu</option>}
        {categoriesForType.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Suma (€)" type="number" step="0.01" error={errors.amount?.message} {...register("amount")} />
        <Input label="Dátum" type="date" error={errors.date?.message} {...register("date")} />
      </div>

      <Input label="Poznámka (voliteľné)" placeholder="napr. Nákup potravín" error={errors.note?.message} {...register("note")} />

      {canRememberRule && (
        <div className="flex flex-col gap-2 rounded-lg bg-slate-50 p-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register("rememberRule")} />
            Zapamätať kategóriu pre podobné transakcie
          </label>
          {rememberRule && (
            <Input
              label="Popis obsahuje"
              placeholder="napr. bolt"
              error={errors.rulePattern?.message}
              {...register("rulePattern")}
            />
          )}
        </div>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Zrušiť
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={categoriesForType.length === 0}>
          Uložiť
        </Button>
      </div>
    </form>
  );
}
