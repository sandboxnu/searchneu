"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface User {
  userId: string;
}

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  signUser: (user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (data.user) {
          setUser(data.user);
          setStatus("authenticated");
        } else {
          setUser(null);
          setStatus("unauthenticated");
        }
      } catch (error) {
        console.error("Failed to check session:", error);
        setStatus("unauthenticated");
      }
    };

    checkSession();
  }, []);

  function signUser(user: User) {
    setUser(user);
    setStatus("authenticated");
  }

  function signOut() {
    try {
      setUser(null);
      setStatus("unauthenticated");
      router.refresh();
    } catch (err) {
      console.error("sign out failed:", err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, status, signUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
