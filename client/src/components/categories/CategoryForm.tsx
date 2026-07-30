import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import clsx from "clsx";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { CATEGORY_COLOR_SWATCHES } from "@/lib/constants";
import { CATEGORY_ICON_OPTIONS } from "@/lib/categoryIcons";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Zadaj názov kategórie."),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Zvoľ farbu."),
  icon: z.string().min(1, "Zvoľ ikonu."),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function CategoryForm({
  defaultValues,
  isTypeLocked,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  defaultValues?: Partial<CategoryFormValues>;
  isTypeLocked?: boolean;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { type: "EXPENSE", color: CATEGORY_COLOR_SWATCHES[0], icon: "tag", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Input label="Názov" placeholder="napr. Cestovanie" error={errors.name?.message} {...register("name")} />

      <Select label="Typ" disabled={isTypeLocked} error={errors.type?.message} {...register("type")}>
        <option value="EXPENSE">Výdavok</option>
        <option value="INCOME">Príjem</option>
      </Select>

      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">Farba</p>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => field.onChange(color)}
                  className={clsx(
                    "h-7 w-7 rounded-full ring-offset-2 transition-shadow",
                    field.value === color && "ring-2 ring-slate-900"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Farba ${color}`}
                />
              ))}
            </div>
          )}
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">Ikona</p>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_ICON_OPTIONS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => field.onChange(key)}
                  title={label}
                  className={clsx(
                    "flex h-9 items-center justify-center rounded-lg border text-slate-600 transition-colors",
                    field.value === key ? "border-brand-500 bg-brand-50 text-brand-600" : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
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
