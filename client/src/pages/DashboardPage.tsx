import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { apiGetDashboard } from "@/api/dashboard";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { MonthSwitcher } from "@/components/ui/MonthSwitcher";
import { StatCard } from "@/components/dashboard/StatCard";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { TrendChart } from "@/components/charts/TrendChart";

export function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", month, year],
    queryFn: () => apiGetDashboard(month, year),
  });

  function handleMonthChange(nextMonth: number, nextYear: number): void {
    setMonth(nextMonth);
    setYear(nextYear);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Prehľad</h1>
        <MonthSwitcher month={month} year={year} onChange={handleMonthChange} />
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Celkový zostatok" value={Number(data.totalBalance)} icon={Wallet} />
            <StatCard label="Príjmy tento mesiac" value={Number(data.monthlyIncome)} icon={TrendingUp} tone="good" />
            <StatCard label="Výdavky tento mesiac" value={Number(data.monthlyExpense)} icon={TrendingDown} tone="critical" />
            <StatCard
              label="Bilancia mesiaca"
              value={Number(data.monthlyNet)}
              icon={Scale}
              tone={Number(data.monthlyNet) >= 0 ? "good" : "critical"}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Výdavky podľa kategórií</h2>
              <CategoryPieChart data={data.spendingByCategory} />
            </Card>
            <Card>
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Príjmy vs. výdavky (posledných 6 mesiacov)</h2>
              <TrendChart data={data.trend} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
