import Link from "next/link";
import { Logo } from "../icons/logo";
import { UserIcon } from "./UserIcon";

export function Header() {
  // TODO: the courses link should.. ya know... not be hardcoded
  // TODO: hamburger menu for mobile

  return (
    <header className="bg-background sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b-[0.5px] p-4">
      <Link href="/">
        <Logo className="h-6 w-40" />
      </Link>
      <div className="flex items-center gap-8">
        <nav className="space-x-4 font-semibold">
          <Link href="/202530">Courses</Link>
        </nav>
        <UserIcon />
      </div>
    </header>
  );
}
