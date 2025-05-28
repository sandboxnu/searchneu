"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export function signIn(redirectUri: string = window.location.toString()) {
  const params = new URLSearchParams();
  params.set("redirect_uri", redirectUri);

  window.location.assign(`/api/auth/oauth?${params.toString()}`);
}

export function signOut(redirectUri: string = window.location.toString()) {
  const params = new URLSearchParams();
  params.set("redirect_uri", redirectUri);

  window.location.assign(`/api/auth/signout?${params.toString()}`);
}

interface User {
  guid: string | null;
  phoneVerified?: boolean;
  name?: string;
  email?: string;
  image?: string;
}

interface AuthContextType {
  user: User;
  isPending: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isPending, setIsPending] = useState(true);
  const [user, setUser] = useState<User>({ guid: null });

  useEffect(() => {
    async function getUser() {
      try {
        const res = await fetch("/api/auth/me").then((r) => r.json());
        setUser(res);
      } finally {
        setIsPending(false);
      }
    }
    getUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
}
