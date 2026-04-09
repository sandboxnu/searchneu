"use client";
// client component wrapper, isolated here to prevent random ID generation from causing
// hydration mismatches when used inside the server-rendered header

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { MenuIcon } from "lucide-react";
import { Logo } from "../icons/logo";
import Link from "next/link";
import { UserIcon } from "./UserMenu";
import { NavBar } from "./NavBar";

export function MobileNav({
  flags,
  isGuest,
}: {
  flags: { [key: string]: Promise<boolean> };
  isGuest: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="bg-neu1 rounded-full border lg:hidden"
        >
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
          <NavBar flags={flags} closeable isGuest={isGuest} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
