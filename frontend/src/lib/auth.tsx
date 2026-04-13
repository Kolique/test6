"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, type LoginResponse } from "./api";

interface AuthState {
  token: string | null;
  userId: string | null;
  tenantId: string | null;
  fullName: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "mairia_auth";

function loadAuth(): AuthState {
  if (typeof window === "undefined") {
    return { token: null, userId: null, tenantId: null, fullName: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { token: null, userId: null, tenantId: null, fullName: null };
}

function saveAuth(state: AuthState) {
  if (typeof window === "undefined") return;
  if (state.token) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(loadAuth);
  const router = useRouter();

  useEffect(() => {
    saveAuth(auth);
  }, [auth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res: LoginResponse = await apiLogin(email, password);
      setAuth({
        token: res.access_token,
        userId: res.user_id,
        tenantId: res.tenant_id,
        fullName: res.full_name,
      });
      router.push("/admin/documents");
    },
    [router]
  );

  const logout = useCallback(() => {
    setAuth({ token: null, userId: null, tenantId: null, fullName: null });
    router.push("/admin/login");
  }, [router]);

  const value = useMemo(
    () => ({
      ...auth,
      login,
      logout,
      isAuthenticated: !!auth.token,
    }),
    [auth, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
