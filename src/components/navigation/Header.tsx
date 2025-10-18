import Link from "next/link";
import { Logo } from "../icons/logo";
import { UserIcon } from "./UserMenu";
import { faqFlag, roomsFlag } from "@/lib/flags";
import { Bookmark, CircleQuestionMark, DoorOpen } from "lucide-react";

/**
 * Header Component
 * Top navigation bar with logo and navigation links
 */
export async function Header() {
  const enableFaqPage = await faqFlag();
  const enableRoomsPage = await roomsFlag();

  return (
    <header className="bg-secondary z-20 flex h-14 w-full items-center justify-between px-6 pt-6 pb-4">
      <Link href="/" aria-label="Home">
        <Logo className="h-6 w-40" />
      </Link>
      
      <div className="flex items-center gap-2">
        <nav className="flex gap-2 font-semibold">
          {enableRoomsPage && (
            <Link
              href="/rooms"
              className="hover:bg-primary bg-background flex items-center gap-2 rounded-full border-1 px-4 py-2"
            >
              <DoorOpen className="h-6" />
              <span>Rooms</span>
            </Link>
          )}
          
          <Link
            href="/catalog"
            className="hover:bg-primary bg-background flex items-center gap-2 rounded-full border-1 px-4 py-2"
          >
            <Bookmark className="h-6" />
            <span>Catalog</span>
          </Link>
          
          {enableFaqPage && (
            <Link
              href="/faq"
              className="hover:bg-primary bg-background flex items-center gap-2 rounded-full border-1 px-2 py-2"
              aria-label="Frequently Asked Questions"
            >
              <CircleQuestionMark color="red" className="h-6" />
            </Link>
          )}
        </nav>
        
        <UserIcon />
      </div>
    </header>
  );
}
