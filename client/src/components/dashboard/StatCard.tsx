import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "good" | "critical";
}) {
  const toneClasses = {
    default: "bg-brand-50 text-brand-600",
    good: "bg-green-50 text-green-700",
    critical: "bg-red-50 text-red-700",
  } as const;

  return (
    <Card className="flex items-center gap-4">
      <div className={clsx("flex h-11 w-11 items-center justify-center rounded-lg", toneClasses[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900">
          {typeof value === "number" ? formatCurrency(value) : value}
        </p>
      </div>
    </Card>
  );
}
