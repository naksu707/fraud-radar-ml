"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, TOKEN_KEY, type Session, type User } from "./api";

type AuthValue = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; company?: string }) => Promise<User>;
  logout: () => void;
  setUser: (u: User) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export const ROLE_LABEL: Record<User["role"], string> = { ANALYST: "Fraud analyst", ADMIN: "Administrator" };
const ROLE_LABEL_ES: Record<User["role"], string> = { ANALYST: "Analista de fraude", ADMIN: "Administrador" };
export const roleLabel = (r: User["role"], lang: "en" | "es") => (lang === "es" ? ROLE_LABEL_ES : ROLE_LABEL)[r];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!window.localStorage.getItem(TOKEN_KEY)) { setReady(true); return; }
    api.me().then(setUser).catch(logout).finally(() => setReady(true));
  }, [logout]);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener("fraud-radar:unauthorized", onUnauthorized);
    return () => window.removeEventListener("fraud-radar:unauthorized", onUnauthorized);
  }, [logout]);

  const start = useCallback((s: Session) => {
    window.localStorage.setItem(TOKEN_KEY, s.token);
    setUser(s.user);
    return s.user;
  }, []);

  const value = useMemo<AuthValue>(() => ({
    user,
    ready,
    login: async (email, password) => start(await api.login(email, password)),
    register: async (data) => start(await api.register(data)),
    logout,
    setUser,
  }), [user, ready, start, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
