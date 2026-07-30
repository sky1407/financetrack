import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth musí byť použitý vnútri <AuthProvider>.");
  return ctx;
}
