import Link from "next/link";
import { Logo } from "../icons/logo";
import { UserIcon } from "./UserMenu";
import { faqFlag, roomsFlag } from "@/lib/flags";
import {
  Bookmark,
  BugIcon,
  CircleQuestionMark,
  DoorOpen,
  MenuIcon,
} from "lucide-react";
import { Suspense } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Button } from "../ui/button";
import { NeuSearchskiePattern } from "../home/NeuSearchskiePattern";

export async function Header() {
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
        <Suspense>
          <NavBar />
        </Suspense>
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
            <Suspense>
              <NavBar />
            </Suspense>
          </div>
          <UserIcon />
        </SheetContent>
      </Sheet>
    </header>
  );
}

async function NavBar() {
  const enableFaqPage = await faqFlag();
  const enableRoomsPage = await roomsFlag();

  return (
    <nav className="gap-2 font-semibold">
      {enableRoomsPage && (
        <Link
          href="/rooms"
          className="hover:bg-neu2 bg-neu1 flex items-center gap-2 rounded-full border-1 px-4 py-2 text-sm"
        >
          <DoorOpen className="size-4" />
          <span>Rooms</span>
        </Link>
      )}
      <Link
        href="/catalog"
        className="hover:bg-neu2 bg-neu1 flex items-center gap-2 rounded-full border-1 px-4 py-2 text-sm"
      >
        <Bookmark className="size-4" />
        <span>Catalog</span>
      </Link>
      {enableFaqPage && (
        <Link
          href="/faq"
          className="hover:bg-neu2 bg-neu1 flex items-center rounded-full border-1 p-2 text-sm"
        >
          <CircleQuestionMark className="text-red size-5" />
        </Link>
      )}
    </nav>
  );
}
