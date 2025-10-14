import Link from "next/link";
import { Logo } from "../icons/logo";
import { UserIcon } from "./UserMenu";
import { faqFlag, roomsFlag } from "@/lib/flags";

export async function Header() {
  const enableFaqPage = await faqFlag();
  const enableRoomsPage = await roomsFlag();
  // TODO: hamburger menu for mobile

  return (
    <header className="bg-secondary sticky top-0 z-[100] flex h-14 w-full items-center justify-between px-6 pt-6 pb-4">
      <Link href="/">
        <Logo className="h-6 w-40" />
      </Link>
      <div className="flex items-center gap-4">
        <nav className="space-x-2 font-semibold">
          <Link
            href="/catalog"
            className="hover:bg-neu3 bg-background rounded-full border-1 px-4 py-2"
          >
            Catalog
          </Link>
          {enableRoomsPage && (
            <Link
              href="/rooms"
              className="hover:bg-neu3 bg-background rounded-full border-1 px-4 py-2"
            >
              Rooms
            </Link>
          )}
          {enableFaqPage && (
            <Link href="/faq" className="hover:bg-neu3 rounded-lg p-2">
              FAQ
            </Link>
          )}
        </nav>
        <UserIcon />
      </div>
    </header>
  );
}
