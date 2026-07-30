import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ACCOUNT_TYPE_LABELS } from "@/lib/constants";

const accountFormSchema = z.object({
  name: z.string().min(1, "Zadaj názov účtu."),
  type: z.enum(["CASH", "BANK", "CARD", "SAVINGS", "OTHER"]),
  currency: z.string().length(3, "Mena musí mať 3 znaky, napr. EUR."),
  initialBalance: z.coerce.number({ invalid_type_error: "Zadaj číslo." }).finite(),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  defaultValues?: Partial<AccountFormValues>;
  onSubmit: (values: AccountFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { type: "BANK", currency: "EUR", initialBalance: 0, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Input label="Názov" placeholder="napr. Bežný účet" error={errors.name?.message} {...register("name")} />
      <Select label="Typ účtu" error={errors.type?.message} {...register("type")}>
        {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Mena" placeholder="EUR" error={errors.currency?.message} {...register("currency")} />
        <Input
          label="Počiatočný zostatok"
          type="number"
          step="0.01"
          error={errors.initialBalance?.message}
          {...register("initialBalance")}
        />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Zrušiť
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Uložiť
        </Button>
      </div>
    </form>
  );
}
