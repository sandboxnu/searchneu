import Link from "next/link";
import { Logo } from "../icons/logo";
import { UserIcon } from "./UserMenu";
import {
  faqFlag,
  graduateFlag,
  notificationsFlag,
  roomsFlag,
  schedulerFlag,
} from "@/lib/flags";
import { MenuIcon, XIcon } from "lucide-react";
import { Suspense } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { NavBar } from "./NavBar";

export function Header() {
  const enableFaqPage = faqFlag();
  const enableRoomsPage = roomsFlag();
  const enableSchedulerPage = schedulerFlag();
  const enableGraduatePage = graduateFlag();
  const enableNotificationsPage = notificationsFlag();

  const flags = {
    rooms: enableRoomsPage,
    faq: enableFaqPage,
    scheduler: enableSchedulerPage,
    graduate: enableGraduatePage,
    notifications: enableNotificationsPage,
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
        <UserIcon />
      </div>
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
        <SheetContent className="bg-neu2 flex w-[90%] flex-col justify-between px-6 pt-6 pb-4">
          <SheetTitle className="hidden">Nav bar</SheetTitle>
          <div className="flex flex-col gap-8">
            <Link href="/">
              <Logo className="h-6 w-40" />
            </Link>
            <UserIcon />
            <Suspense>
              <NavBar flags={flags} closeable />
            </Suspense>
          </div>
          <SheetClose className="bg-neu1 absolute top-4 right-4 flex size-9 items-center justify-center rounded-full border disabled:pointer-events-none">
            <XIcon className="size-6" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetContent>
      </Sheet>
    </header>
  );
}
