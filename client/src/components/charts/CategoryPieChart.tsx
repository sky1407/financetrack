import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { DashboardCategorySpending } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";

export function CategoryPieChart({ data }: { data: DashboardCategorySpending[] }) {
  if (data.length === 0) {
    return <EmptyState title="Zatiaľ žiadne výdavky" description="Pridaj transakcie a uvidíš rozdelenie podľa kategórií." />;
  }

  const chartData = data.map((d) => ({ ...d, value: Number(d.amount) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          strokeWidth={2}
          stroke="#fcfcfb"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{ borderRadius: 8, borderColor: "#e1e0d9", fontSize: 13 }}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
