import Link from "next/link";
import { Logo } from "../icons/logo";
import { UserIcon } from "./UserMenu";
import { faqFlag, roomsFlag, schedulerFlag } from "@/lib/flags";
import { Bookmark, CircleQuestionMark } from "lucide-react"; // 👈 Add icons

export async function Header() {
  const enableFaqPage = await faqFlag();
  const enableRoomsPage = await roomsFlag();
  const enableSchedulerPage = await schedulerFlag();
  // TODO: hamburger menu for mobile

  return (
    <header className="bg-secondary z-20 flex h-14 w-full items-center justify-between px-6 pt-6 pb-4">
      <Link href="/">
        <Logo className="h-6 w-40" />
      </Link>
      <div className="flex items-center gap-4">
        <nav className="flex gap-2 font-semibold">
          {enableRoomsPage && (
            <Link
              href="/rooms"
              className="hover:bg-neu3 bg-background flex items-center gap-2 rounded-full border-1 px-4 py-2"
            >
              <Bookmark className="h-6" />
              <span>Rooms</span>
            </Link>
          )}
          <Link
            href="/catalog"
            className="hover:bg-neu3 bg-background flex items-center gap-2 rounded-full border-1 px-4 py-2 leading-none"
          >
            <Bookmark className="h-6" />
            <span>Catalog</span>
          </Link>
          {enableSchedulerPage && (
            <Link
              href="/scheduler"
              className="hover:bg-neu3 bg-background rounded-full border-1 px-4 py-2"
            >
              Plan
            </Link>
          )}
          {enableFaqPage && (
            <Link
              href="/faq"
              className="hover:bg-neu3 bg-background flex items-center gap-2 rounded-full border-1 px-2 py-2"
            >
              <CircleQuestionMark color="red" />
            </Link>
          )}
        </nav>
        <UserIcon />
      </div>
    </header>
  );
}
