"use client";
// error boundaries must be client components

import { Five00skie } from "@/components/icons/Five00skie";
import { Logo } from "@/components/icons/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BookmarkIcon,
  CircleQuestionMarkIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen w-screen flex-col overflow-hidden px-6 pt-4 pb-6">
      <ErrorHeader />

      <div className="bg-neu1 mt-4 flex flex-1 flex-col items-center gap-[13px] rounded-xl pt-[140px] pb-8 text-center md:pt-[208px]">
        <div className="relative">
          <p className="text-neu3 text-[150px] font-extrabold md:text-[248px]">
            500
          </p>
          <p className="text-neu5 text-[32px] font-semibold">server is down</p>
          <p className="text-neu5 text-[20px]">cooked...</p>
          <Five00skie className="absolute -top-8/24 -right-15/64 w-[150px] md:top-7/24 md:-right-31/64 md:w-full" />
        </div>
      </div>
    </div>
  );
}

function ErrorHeader() {
  const pathname = usePathname();

  const Nav = (
    <nav className="flex gap-2 font-semibold">
      <Link
        href="/catalog"
        data-active={pathname.startsWith("/catalog")}
        className="bg-neu1 data-[active=true]:border-neu3 flex w-full items-center gap-2 rounded-full border-1 px-4 py-2 text-sm"
      >
        <BookmarkIcon className="size-4" />
        <span>Catalog</span>
      </Link>
      <Link
        href="/faq"
        data-active={pathname === "/faq"}
        className="bg-neu1 data-[active=true]:border-neu3 flex items-center rounded-full border-1 p-2 text-sm"
      >
        <CircleQuestionMarkIcon className="text-red size-5" />
      </Link>
    </nav>
  );

  return (
    <header className="z-20 flex h-9 w-full items-center justify-between bg-transparent">
      <Link href="/">
        <Logo className="h-6 w-40" />
      </Link>

      <div className="hidden items-center gap-2 lg:flex">{Nav}</div>
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
            {Nav}
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
