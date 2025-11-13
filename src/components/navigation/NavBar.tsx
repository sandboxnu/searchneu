"use client";
import { Bookmark, CircleQuestionMark, DoorOpen } from "lucide-react";
import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlagValues } from "flags/react";
import { ErrorBoundary } from "react-error-boundary";
import { NavErrorFallback } from "../navigation/NavError"

export function NavBar({
  flags,
}: {
  flags: { [key: string]: Promise<boolean> };
}) {
  const roomsFlag = use(flags["rooms"]);
  const faqFlag = use(flags["faq"]);
  const schedulerFlag = use(flags["scheduler"]);

  const pathname = usePathname();

  return (
    <nav className="flex gap-2 font-semibold">
      <FlagValues
        values={{
          "faq-page": faqFlag,
          rooms: roomsFlag,
          scheduler: schedulerFlag,
        }}
      />
      <ErrorBoundary FallbackComponent = {NavErrorFallback}>
        {roomsFlag && (
          <Link
            href="/rooms"
            data-active={pathname === "/rooms"}
            className="bg-neu1 flex items-center gap-2 rounded-full border-1 px-4 py-2 text-sm"
          >
            <DoorOpen className="size-4" />
            <span>Rooms</span>
          </Link>
        )}
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent = {NavErrorFallback}>
        <Link
          href="/catalog"
          data-active={pathname.startsWith("/catalog")}
          className="bg-neu1 data-[active=true]:border-neu3 flex w-full items-center gap-2 rounded-full border-1 px-4 py-2 text-sm"
        >
            <Bookmark className="size-4" />
            <span>Catalog</span>
        </Link>
        {schedulerFlag && (
          <Link
            href="/scheduler"
            data-active={pathname === "/scheduler"}
            className="bg-neu1 data-[active=true]:border-neu3 flex w-full items-center rounded-full border-1 p-2 text-sm"
          >
            Scheduler
          </Link>
        )}
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={NavErrorFallback}>
        {faqFlag && (
          <Link
            href="/faq"
            data-active={pathname === "/faq"}
            className="bg-neu1 data-[active=true]:border-neu3 flex items-center rounded-full border-1 p-2 text-sm"
          >
            <CircleQuestionMark className="text-red size-5" />
          </Link>
        )}
      </ErrorBoundary>
    </nav>
  );
}
