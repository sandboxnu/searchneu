import Link from "next/link";
import { Button } from "./ui/button";

export function Header() {
  // TODO: the courses link should.. ya know... not be hardcoded
  // TODO: hamburger menu for mobile

  return (
    <header className="w-full h-14 flex justify-between items-center p-4 sticky top-0 z-50 bg-background border-b-[0.5px]">
      <Link href="/">
        <span className="text-2xl">
          <span className="text-primary">Search</span>
          <span className="text-accent font-extrabold">NEU</span>
        </span>
      </Link>
      <div className="flex gap-8 items-center">
        <nav className="font-semibold space-x-4">
          <Link href="/202530">Courses</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <Button className="font-bold">Sign In</Button>
      </div>
    </header>
  );
}
