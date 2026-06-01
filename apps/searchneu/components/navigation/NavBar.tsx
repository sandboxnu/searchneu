"use client";
import { cn } from "@/lib/cn";
import { FlagValues } from "flags/react";
import {
  Bell,
  BookMarked,
  Calendar,
  CircleQuestionMark,
  DoorOpen,
  GraduationCapIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, use } from "react";
import { SheetClose } from "../ui/sheet";

export function NavBar({
  flags,
  closeable = false,
  isGuest = false,
}: {
  flags: { [key: string]: Promise<boolean> };
  closeable?: boolean;
  isGuest: boolean;
}) {
  const roomsFlag = use(flags["rooms"]);
  const graduateFlag = use(flags["graduate"]);

  const pathname = usePathname();

  return (
    <nav className={cn("flex gap-2 font-semibold", { "flex-col": closeable })}>
      <FlagValues
        values={{
          rooms: roomsFlag,
        }}
      />
      {roomsFlag && (
        <LinkWrapper mobileNav={closeable}>
          <Link
            href="/rooms"
            data-active={pathname === "/rooms"}
            className="bg-neu1 flex items-center gap-2 rounded-full border-1 px-4 py-2 text-sm"
          >
            <DoorOpen className="size-4" />
            <span>Rooms</span>
          </Link>
        </LinkWrapper>
      )}
      {graduateFlag && (
        <LinkWrapper mobileNav={closeable}>
          <Link
            href={isGuest ? "/graduate/guest" : "/graduate"}
            data-active={pathname === "/graduate"}
            className="bg-neu1 data-[active=true]:border-neu3 flex w-full items-center gap-2 rounded-full border-1 p-2 text-sm"
          >
            <GraduationCapIcon className="size-4" />
            Graduate
          </Link>
        </LinkWrapper>
      )}
      <LinkWrapper mobileNav={closeable}>
        <Link
          href="/catalog"
          data-active={pathname === "/catalog"}
          className="bg-neu1 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-1 p-2 px-4 text-sm"
        >
          <BookMarked className="size-4" />
          <span>Catalog</span>
        </Link>
      </LinkWrapper>
      <LinkWrapper mobileNav={closeable}>
        <Link
          href="/scheduler"
          data-active={pathname === "/scheduler"}
          className="bg-neu1 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-1 p-2 px-4 text-sm"
        >
          <Calendar className="size-4" />
          Scheduler
        </Link>
      </LinkWrapper>
      <LinkWrapper mobileNav={closeable}>
        <Link
          href="/notifications"
          data-active={pathname === "/notifications"}
          className="bg-neu1 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-1 p-2 px-4 text-sm"
        >
          <Bell className="size-4" />
          <span>Notifications</span>
        </Link>
      </LinkWrapper>
      <LinkWrapper mobileNav={closeable}>
        <Link
          href="/faq"
          data-active={pathname === "/faq"}
          className="bg-neu1 data-[active=true]:border-neu3 flex items-center rounded-full border-1 p-2 text-sm"
        >
          <CircleQuestionMark className="text-red size-5" />
        </Link>
      </LinkWrapper>
    </nav>
  );
}

function LinkWrapper({
  mobileNav,
  children,
}: {
  mobileNav: boolean;
  children: ReactNode;
}) {
  if (mobileNav) {
    return <SheetClose asChild={true}>{children}</SheetClose>;
  }

  return children;
}
