import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types";

const budgetFormSchema = z.object({
  categoryId: z.string().min(1, "Zvoľ kategóriu."),
  amount: z.coerce.number({ invalid_type_error: "Zadaj sumu." }).positive("Suma musí byť kladné číslo."),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export function BudgetForm({
  availableCategories,
  isCategoryLocked,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  availableCategories: Category[];
  isCategoryLocked?: boolean;
  defaultValues?: Partial<BudgetFormValues>;
  onSubmit: (values: BudgetFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: { categoryId: availableCategories[0]?.id ?? "", amount: 100, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Select label="Kategória" disabled={isCategoryLocked} error={errors.categoryId?.message} {...register("categoryId")}>
        {availableCategories.length === 0 && <option value="">Žiadne dostupné kategórie</option>}
        {availableCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Input label="Mesačný limit (€)" type="number" step="0.01" error={errors.amount?.message} {...register("amount")} />
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Zrušiť
        </Button>
        <Button type="submit" isLoading={isSubmitting} disabled={availableCategories.length === 0}>
          Uložiť
        </Button>
      </div>
    </form>
  );
}
