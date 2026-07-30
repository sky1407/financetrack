import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parse } from "date-fns";
import { sk } from "date-fns/locale";
import { formatCurrency } from "@/lib/format";
import type { DashboardTrendPoint } from "@/types";

const INCOME_COLOR = "#0ca30c";
const EXPENSE_COLOR = "#d03b3b";

function formatMonthLabel(monthKey: string): string {
  return format(parse(monthKey, "yyyy-MM", new Date()), "LLL yyyy", { locale: sk });
}

export function TrendChart({ data }: { data: DashboardTrendPoint[] }) {
  const chartData = data.map((point) => ({
    month: formatMonthLabel(point.month),
    Príjmy: Number(point.income),
    Výdavky: Number(point.expense),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} barGap={4}>
        <CartesianGrid stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#898781" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) => formatCurrency(value)}
          width={80}
        />
        <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: 8, borderColor: "#e1e0d9", fontSize: 13 }} />
        <Legend />
        <Bar dataKey="Príjmy" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="Výdavky" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
