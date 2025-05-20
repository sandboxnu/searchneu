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

export function useAuth() {
  const [isPending, setIsPending] = useState(true);
  const [user, setUser] = useState<{ guid: string | null }>({ guid: null });

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

// function getBaseUrl(req) {
//   const protocol = req.headers['x-forwarded-proto'];
//   const host = req.headers['x-forwarded-host'];
//   return `${protocol}://${host}`;
// }
