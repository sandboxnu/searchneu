import Link from "next/link";
import { Logo } from "../icons/logo";
import { UserIcon } from "./UserMenu";
import { faqFlag, roomsFlag, schedulerFlag } from "@/lib/flags";
import { BugIcon, MenuIcon } from "lucide-react";
import { Suspense } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { NeuSearchskiePattern } from "../home/NeuSearchskiePattern";
import { NavBar } from "./NavBar";

export function Header() {
  const enableFaqPage = faqFlag();
  const enableRoomsPage = roomsFlag();
  const enableSchedulerPage = schedulerFlag();

  const Nav = (
    <Suspense>
      <NavBar
        flags={{
          rooms: enableRoomsPage,
          faq: enableFaqPage,
          scheduler: enableSchedulerPage,
        }}
      />
    </Suspense>
  );

  return (
    <header className="z-20 flex h-9 w-full items-center justify-between bg-transparent px-4 md:px-6">
      <Link href="/">
        <Logo className="h-6 w-40" />
      </Link>
      <span className="text-neu8 border-yellow bg-yellow/40 hidden items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold md:flex">
        <BugIcon className="size-4" />
        Beta - unstable & experimental
      </span>
      <div className="hidden items-center gap-2 lg:flex">
        {Nav}
        <UserIcon />
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="bg-neu1 rounded-full lg:hidden"
          >
            <MenuIcon className="text-neu8 size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex w-[90%] flex-col justify-between px-6 pt-4 pb-4">
          <NeuSearchskiePattern count={20} />
          <SheetTitle className="hidden">Nav bar</SheetTitle>
          <div className="flex flex-col gap-4">
            <Link href="/">
              <Logo className="h-6 w-40" />
            </Link>
            <span className="text-neu8 border-yellow bg-yellow/40 flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold">
              <BugIcon className="size-4" />
              Beta - unstable & experimental
            </span>
            {Nav}
          </div>
          <UserIcon />
        </SheetContent>
      </Sheet>
    </header>
  );
}
