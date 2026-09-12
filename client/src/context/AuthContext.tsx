import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetchMe, apiLogin, apiLogout, apiRegister, type LoginPayload, type RegisterPayload } from "@/api/auth";
import { activateDemoMode, deactivateDemoMode, DEMO_USER, isDemoMode } from "@/lib/demoMode";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  loginDemo: () => void;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Demo mode never touches the backend — not even to check who's logged in —
    // so the public demo link works instantly even if the real API is down.
    if (isDemoMode()) {
      setUser(DEMO_USER);
      setIsLoading(false);
      return;
    }
    apiFetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const loggedInUser = await apiLogin(payload);
    setUser(loggedInUser);
  }, []);

  const loginDemo = useCallback(() => {
    activateDemoMode();
    setUser(DEMO_USER);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const registeredUser = await apiRegister(payload);
    setUser(registeredUser);
  }, []);

  const logout = useCallback(async () => {
    if (isDemoMode()) {
      deactivateDemoMode();
      setUser(null);
      return;
    }
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, loginDemo, register, logout }),
    [user, isLoading, login, loginDemo, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
