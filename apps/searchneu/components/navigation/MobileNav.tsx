"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import {
  BellIcon,
  BookMarkedIcon,
  CalendarIcon,
  CircleQuestionMarkIcon,
  DoorOpenIcon,
  GraduationCapIcon,
  MenuIcon,
} from "lucide-react";
import { Logo } from "../icons/logo";
import Link from "next/link";
import { UserIcon } from "./UserMenu";
import { FlagValues } from "flags/react";
import { usePathname } from "next/navigation";
import { use } from "react";

interface MobileNavParams {
  flags: { [key: string]: Promise<boolean> };
}

export function MobileNav({ flags }: MobileNavParams) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <MenuIcon className="text-neu8 size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="bg-neu2 flex w-[90%] flex-col justify-between px-6 pt-6 pb-4"
        showCloseButton={true}
      >
        <SheetTitle className="hidden">Nav bar</SheetTitle>
        <div className="flex flex-col gap-8">
          <Link href="/">
            <Logo className="h-6 w-40" />
          </Link>
          <UserIcon />
          <MobileNavLinks flags={flags} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MobileNavLinks({ flags }: MobileNavParams) {
  const roomsFlag = use(flags["rooms"]);
  const graduateFlag = use(flags["graduate"]);

  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 font-semibold">
      <FlagValues
        values={{
          rooms: roomsFlag,
        }}
      />
      {roomsFlag && (
        <SheetClose asChild>
          <Link
            href="/rooms"
            data-active={pathname.includes("/rooms")}
            className="bg-neu0 flex items-center gap-2 rounded-full border px-4 py-2 text-sm"
          >
            <DoorOpenIcon className="size-4" />
            <span>Rooms</span>
          </Link>
        </SheetClose>
      )}
      {graduateFlag && (
        <SheetClose asChild>
          <Link
            // NOTE: access control should be on the page, not navigation
            // href={isGuest ? "/graduate/guest" : "/graduate"}
            href="/graduate"
            data-active={pathname.includes("/graduate")}
            className="bg-neu0 data-[active=true]:border-neu3 flex w-full items-center gap-2 rounded-full border p-2 text-sm"
          >
            <GraduationCapIcon className="size-4" />
            Graduate
          </Link>
        </SheetClose>
      )}
      <SheetClose asChild>
        <Link
          href="/catalog"
          data-active={pathname.includes("/catalog")}
          className="bg-neu0 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border p-2 px-4 text-sm"
        >
          <BookMarkedIcon className="size-4" />
          <span>Catalog</span>
        </Link>
      </SheetClose>
      <SheetClose asChild>
        <Link
          href="/scheduler"
          data-active={pathname.includes("/scheduler")}
          className="bg-neu0 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border p-2 px-4 text-sm"
        >
          <CalendarIcon className="size-4" />
          <span> Scheduler</span>
        </Link>
      </SheetClose>
      <SheetClose asChild>
        <Link
          href="/notifications"
          data-active={pathname.includes("/notifications")}
          className="bg-neu0 data-[active=true]:border-neu3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border p-2 px-4 text-sm"
        >
          <BellIcon className="size-4" />
          <span>Notifications</span>
        </Link>
      </SheetClose>
      <SheetClose asChild>
        <Link
          href="/faq"
          data-active={pathname.includes("/faq")}
          className="bg-neu0 data-[active=true]:border-neu3 flex items-center rounded-full border p-2 text-sm"
        >
          <CircleQuestionMarkIcon className="text-r5 size-5" />
        </Link>
      </SheetClose>
    </nav>
  );
}
