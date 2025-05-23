"use client";
import { useEffect, useState } from "react";

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

export function useAuth() {
  const [isPending, setIsPending] = useState(true);
  const [user, setUser] = useState<User>({ guid: null });

  useEffect(() => {
    async function getUser() {
      const res = await fetch("/api/auth/me").then((r) => r.json());

      setUser(res);
      setIsPending(false);
    }

    getUser();
  }, []);

  return { user, isPending };
}
