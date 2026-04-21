import Link from "next/link";
import { Logo } from "../icons/logo";
import { UserIcon } from "./UserMenu";
import { graduateFlag, roomsFlag } from "@/lib/flags";
import { Suspense } from "react";
import { NavBar } from "./NavBar";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const flags = {
    rooms: roomsFlag(),
    graduate: graduateFlag(),
  };

  return (
    <header className="z-20 flex h-9 w-full items-center justify-between bg-transparent px-4 md:px-6">
      <Link href="/">
        <Logo className="h-6 w-40" />
      </Link>
      <div className="hidden items-center gap-2 lg:flex">
        <Suspense>
          <NavBar flags={flags} />
        </Suspense>
        <Suspense>
          <MobileNav flags={flags} />
        </Suspense>
        <UserIcon />
      </div>
    </header>
  );
}
