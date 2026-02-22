"use client";
import {
  Bookmark,
  CircleQuestionMark,
  DoorOpen,
  GraduationCapIcon,
} from "lucide-react";
import { type ReactNode, use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlagValues } from "flags/react";
import { SheetClose } from "../ui/sheet";

export function NavBar({
  flags,
  closeable = false,
}: {
  flags: { [key: string]: Promise<boolean> };
  closeable?: boolean;
}) {
  const roomsFlag = use(flags["rooms"]);
  const faqFlag = use(flags["faq"]);
  const schedulerFlag = use(flags["scheduler"]);
  const graduateFlag = use(flags["graduate"]);

  const pathname = usePathname();

  return (
    <nav className="flex gap-2 font-semibold">
      <FlagValues
        values={{
          faqs: faqFlag,
          rooms: roomsFlag,
          scheduler: schedulerFlag,
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
      <LinkWrapper mobileNav={closeable}>
        <Link
          href="/catalog"
          data-active={pathname.startsWith("/catalog")}
          className="bg-neu1 data-[active=true]:border-neu3 flex w-full items-center gap-2 rounded-full border-1 px-4 py-2 text-sm"
        >
          <Bookmark className="size-4" />
          <span>Catalog</span>
        </Link>
      </LinkWrapper>
      {schedulerFlag && (
        <LinkWrapper mobileNav={closeable}>
          <Link
            href="/scheduler"
            data-active={pathname === "/scheduler"}
            className="bg-neu1 data-[active=true]:border-neu3 flex w-full items-center rounded-full border-1 p-2 text-sm"
          >
            Scheduler
          </Link>
        </LinkWrapper>
      )}
      {graduateFlag && (
        <LinkWrapper mobileNav={closeable}>
          <Link
            href="/graduate"
            data-active={pathname === "/graduate"}
            className="bg-neu1 data-[active=true]:border-neu3 flex w-full items-center gap-2 rounded-full border-1 p-2 text-sm"
          >
            <GraduationCapIcon className="size-4" />
            Graduate
          </Link>
        </LinkWrapper>
      )}
      {faqFlag && (
        <LinkWrapper mobileNav={closeable}>
          <Link
            href="/faq"
            data-active={pathname === "/faq"}
            className="bg-neu1 data-[active=true]:border-neu3 flex items-center rounded-full border-1 p-2 text-sm"
          >
            <CircleQuestionMark className="text-red size-5" />
          </Link>
        </LinkWrapper>
      )}
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
