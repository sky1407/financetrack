import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { isDemoMode } from "@/lib/demoMode";
import { MobileNav } from "./MobileNav";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <MobileNav />
      <div className="text-lg font-semibold text-brand-700 md:hidden">FinanceTrack</div>
      <div className="ml-auto flex items-center gap-3">
        {isDemoMode() && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            Demo<span className="hidden sm:inline"> režim — dáta sa neukladajú natrvalo</span>
          </span>
        )}
        <span className="hidden text-sm text-slate-600 sm:inline">
          Prihlásený ako <strong className="text-slate-900">{user?.name}</strong>
        </span>
        <Button variant="ghost" onClick={() => void logout()} aria-label="Odhlásiť sa" className="px-2 sm:px-4">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Odhlásiť sa</span>
        </Button>
      </div>
    </header>
  );
}
