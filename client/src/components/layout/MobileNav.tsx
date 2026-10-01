import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo, NavItems } from "./Sidebar";

/** Hamburger button with a slide-in drawer; only rendered below the `md` breakpoint. */
export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Otvoriť menu"
        aria-expanded={isOpen}
        aria-controls="mobile-nav"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40" onClick={() => setIsOpen(false)}>
          <aside
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigácia"
            className="flex h-full w-64 max-w-[80vw] flex-col gap-6 bg-white px-4 py-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Zavrieť menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setIsOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}
