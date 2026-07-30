import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Wallet, Tags, PiggyBank, Wallet2 } from "lucide-react";
import clsx from "clsx";

const links = [
  { to: "/", label: "Prehľad", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Transakcie", icon: ArrowLeftRight },
  { to: "/budgets", label: "Rozpočty", icon: PiggyBank },
  { to: "/accounts", label: "Účty", icon: Wallet },
  { to: "/categories", label: "Kategórie", icon: Tags },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <Wallet2 className="h-6 w-6 text-brand-600" />
        <span className="text-lg font-semibold text-slate-900">FinanceTrack</span>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
              )
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
