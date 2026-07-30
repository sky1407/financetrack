import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { Button } from "@/components/ui/Button";

export function MonthSwitcher({
  month,
  year,
  onChange,
}: {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}) {
  function shift(delta: number): void {
    const date = new Date(year, month - 1 + delta, 1);
    onChange(date.getMonth() + 1, date.getFullYear());
  }

  const label = format(new Date(year, month - 1, 1), "LLLL yyyy", { locale: sk });

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onClick={() => shift(-1)} aria-label="Predchádzajúci mesiac">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[9rem] text-center text-sm font-medium capitalize text-slate-700">{label}</span>
      <Button variant="secondary" onClick={() => shift(1)} aria-label="Nasledujúci mesiac">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
