"use client";
import {
  GraduationCapIcon,
  CalendarIcon,
  BellIcon,
  CircleQuestionMarkIcon,
  BookMarkedIcon,
  DoorOpenIcon,
} from "lucide-react";
import { use, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FlagValues } from "flags/react";
import { authClient } from "@/lib/auth/auth-client";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

function DisabledNavItem({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <span
            aria-disabled="true"
            className="bg-neu0 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border p-2 px-4 text-sm opacity-50"
          >
            {children}
          </span>
        }
      />
      <TooltipContent>
        <p>Please sign in</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function NavBar({
  flags,
}: {
  flags: { [key: string]: Promise<boolean> };
}) {
  const roomsFlag = use(flags["rooms"]);
  const graduateFlag = use(flags["graduate"]);

  const pathname = usePathname();
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();
  const signedIn = isPending || session;

  // send users home if they sign out while on a page that requires an account
  const wasSignedIn = useRef(false);
  useEffect(() => {
    if (session) {
      wasSignedIn.current = true;
    } else if (!signedIn && wasSignedIn.current) {
      wasSignedIn.current = false;
      if (
        pathname.startsWith("/scheduler") ||
        pathname.startsWith("/notifications")
      ) {
        router.replace("/");
      }
    }
  }, [session, signedIn, pathname, router]);

  return (
    <nav className="flex gap-2 font-semibold">
      <FlagValues
        values={{
          rooms: roomsFlag,
        }}
      />
      {roomsFlag && (
        <Link
          href="/rooms"
          data-active={pathname.includes("/rooms")}
          className="bg-neu0 flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
        >
          <DoorOpenIcon className="size-4" />
          <span>Rooms</span>
        </Link>
      )}
      {graduateFlag && (
        <Link
          // NOTE: access control should be on the page, not navigation
          href="/graduate"
          data-active={pathname.includes("/graduate")}
          className="bg-neu0 data-[active=true]:border-neu3 flex w-full items-center gap-2 rounded-full border p-2 text-sm"
        >
          <GraduationCapIcon className="size-4" />
          Graduate
        </Link>
      )}
      <Link
        href="/catalog"
        data-active={pathname.includes("/catalog")}
        className="bg-neu0 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border p-2 px-4 text-sm"
      >
        <BookMarkedIcon className="size-4" />
        <span>Catalog</span>
      </Link>
      {signedIn ? (
        <Link
          href="/scheduler"
          data-active={pathname.includes("/scheduler")}
          className="bg-neu0 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border p-2 px-4 text-sm"
        >
          <CalendarIcon className="size-4" />
          <span> Scheduler</span>
        </Link>
      ) : (
        <DisabledNavItem>
          <CalendarIcon className="size-4" />
          <span> Scheduler</span>
        </DisabledNavItem>
      )}
      {signedIn ? (
        <Link
          href="/notifications"
          data-active={pathname.includes("/notifications")}
          className="bg-neu0 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border p-2 px-4 text-sm"
        >
          <BellIcon className="size-4" />
          <span>Notifications</span>
        </Link>
      ) : (
        <DisabledNavItem>
          <BellIcon className="size-4" />
          <span>Notifications</span>
        </DisabledNavItem>
      )}
      <Link
        href="/faq"
        data-active={pathname.includes("/faq")}
        className="bg-neu0 data-[active=true]:border-neu3 flex items-center rounded-full border p-2 text-sm"
      >
        <CircleQuestionMarkIcon className="text-r5 size-5" />
      </Link>
    </nav>
  );
}
