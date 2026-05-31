"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getApiBaseUrl } from "@/lib/api";

type AuthUser = { email: string };

type AuthContextValue = {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  declareSession: (email: string) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  const declareSession = useCallback((email: string) => {
    setUser({ email });
    setStatus("authenticated");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/users/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = (await res.json()) as { email: string };
        setUser({ email: data.email });
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    const base = getApiBaseUrl();
    await fetch(`${base}/api/users/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ user, status, declareSession, refresh, logout }),
    [user, status, declareSession, refresh, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
