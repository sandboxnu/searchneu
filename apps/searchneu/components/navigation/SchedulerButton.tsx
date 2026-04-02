"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import Link from "next/link";
import { SignIn } from "../SignIn";
import { Calendar } from "lucide-react";

export function SchedulerButton({ pathname }: { pathname: string }) {
  const { data: session } = authClient.useSession();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!session) {
    return (
      <>
        <button
          onClick={() => setShowLoginPrompt(true)}
          className="bg-neu1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-1 p-2 px-4 text-sm"
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
      data-active={pathname === "/scheduler"}
      className="bg-neu1 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-1 p-2 px-4 text-sm"
    >
      <Calendar className="size-4" />
      Scheduler
    </Link>
  );
}
