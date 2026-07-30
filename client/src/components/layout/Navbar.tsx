import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="md:hidden text-lg font-semibold text-brand-700">FinanceTrack</div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-slate-600">
          Prihlásený ako <strong className="text-slate-900">{user?.name}</strong>
        </span>
        <Button variant="ghost" onClick={() => void logout()}>
          <LogOut className="h-4 w-4" />
          Odhlásiť sa
        </Button>
      </div>
    </header>
  );
}
