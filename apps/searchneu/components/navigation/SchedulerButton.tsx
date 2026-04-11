"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import Link from "next/link";
import { SignIn } from "../SignIn";
import { Calendar } from "lucide-react";

export function SchedulerButton({ pathname }: { pathname: string }) {
  const { data: session } = authClient.useSession();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  if (!hasMounted || !session) {
    return (
      <>
        <button
          onClick={() => setShowLoginPrompt(true)}
          className="bg-neu2 border-neu3 text-neu6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-1 p-2 px-4 text-sm"
        >
          <Calendar className="size-4" />
          Scheduler
        </button>
        {showLoginPrompt && (
          <SignIn
            closeFn={() => setShowLoginPrompt(false)}
            redirectUrl="/scheduler"
          />
        )}
      </>
    );
  }

  return (
    <Link
      href="/scheduler"
      data-active={pathname.startsWith("/scheduler")}
      className="bg-neu2 data-[active=true]:bg-neu1 border-neu3 data-[active=true]:border-neu4 text-neu6 data-[active=true]:text-neu8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-1 p-2 px-4 text-sm"
    >
      <Calendar className="size-4" />
      Scheduler
    </Link>
  );
}
