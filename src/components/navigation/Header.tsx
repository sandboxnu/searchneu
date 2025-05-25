import Link from "next/link";
import { Logo } from "../icons/logo";
import { UserIcon } from "./UserMenu";
import { faqFlag } from "@/lib/flags";

export async function Header() {
  const enableFaqPage = await faqFlag();
  // TODO: hamburger menu for mobile

  return (
    <header className="bg-neu1 sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b-[0.5px] p-4">
      <Link href="/">
        <Logo className="h-6 w-40" />
      </Link>
      <div className="flex items-center gap-4">
        <nav className="space-x-2 font-semibold">
          <Link href="/catalog" className="hover:bg-neu3 rounded-lg px-3 py-2">
            Catalog
          </Link>
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
