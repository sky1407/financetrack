import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Account, Category } from "@/types";
import type { TransactionFilters as Filters } from "@/api/transactions";

export function TransactionFilters({
  accounts,
  categories,
  filters,
  onChange,
}: {
  accounts: Account[];
  categories: Category[];
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  function update(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch, page: 1 });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[180px] flex-1">
        <Input
          label="Hľadať"
          placeholder="Hľadať v poznámkach..."
          value={filters.search ?? ""}
          onChange={(e) => update({ search: e.target.value || undefined })}
        />
      </div>
      <Select
        label="Typ"
        value={filters.type ?? ""}
        onChange={(e) => update({ type: (e.target.value || undefined) as Filters["type"] })}
      >
        <option value="">Všetky</option>
        <option value="INCOME">Príjem</option>
        <option value="EXPENSE">Výdavok</option>
      </Select>
      <Select label="Účet" value={filters.accountId ?? ""} onChange={(e) => update({ accountId: e.target.value || undefined })}>
        <option value="">Všetky</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </Select>
      <Select
        label="Kategória"
        value={filters.categoryId ?? ""}
        onChange={(e) => update({ categoryId: e.target.value || undefined })}
      >
        <option value="">Všetky</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
      <Input
        label="Od"
        type="date"
        value={filters.dateFrom ?? ""}
        onChange={(e) => update({ dateFrom: e.target.value || undefined })}
      />
      <Input label="Do" type="date" value={filters.dateTo ?? ""} onChange={(e) => update({ dateTo: e.target.value || undefined })} />
    </div>
  );
}
