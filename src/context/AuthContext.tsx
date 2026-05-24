import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/api/client";
import { authService } from "@/api/services";
import { tokenStore } from "@/api/tokenStore";
import type { User } from "@/api/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const init = async () => {
      // No access token in memory after a page reload (refresh token is an
      // HttpOnly cookie, not localStorage). Try /auth/refresh to mint one
      // from the cookie. If the cookie is missing/expired we treat the
      // user as logged out.
      try {
        const { data } = await api.post<{ accessToken: string }>(
          "/auth/refresh",
          {},
        );
        tokenStore.setAccess(data.accessToken);
        const me = await authService.me();
        if (active) setUser(me);
      } catch {
        tokenStore.clear();
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    if (res.user.role !== "ADMIN") {
      throw new Error("This account doesn't have admin access.");
    }
    // Backend set the refresh token as a cookie; we only stash the
    // access token in memory for the bearer header.
    tokenStore.setAccess(res.accessToken);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    await authService.logout();
    tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
