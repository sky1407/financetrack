import type { User } from "@/types";

/**
 * Client-side demo mode: lets a visitor see the app fully working (dashboard,
 * charts, CRUD) without registering and without any call to the backend.
 * Activated via the "Vyskúšať demo" button or a "?demo=1" link, and persisted
 * in sessionStorage so it survives client-side navigation and page refreshes
 * within the same browser tab.
 */

const STORAGE_KEY = "financetrack_demo";

export const DEMO_USER: User = {
  id: "demo-user",
  name: "Demo účet",
  email: "demo@financetrack.app",
};

function readStoredFlag(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function readInitialFlag(): boolean {
  if (typeof window === "undefined") return false;
  if (new URLSearchParams(window.location.search).get("demo") === "1") return true;
  return readStoredFlag();
}

let demoActive = readInitialFlag();

export function isDemoMode(): boolean {
  return demoActive;
}

export function activateDemoMode(): void {
  demoActive = true;
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — demo still works for this page load
  }
}

export function deactivateDemoMode(): void {
  demoActive = false;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
