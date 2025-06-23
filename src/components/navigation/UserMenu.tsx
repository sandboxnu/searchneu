"use client";

import { SignIn } from "../SignIn";
import { Button } from "../ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import Link from "next/link";
import { Iconskie } from "../icons/Iconskie";
import { useAuth, signOut, User } from "@/lib/auth/client";
import { BadgeCheck } from "lucide-react";

export function UserIcon() {
  const [showSI, setShowSI] = useState(false);
  const { user, isPending } = useAuth();

  if (!isPending && user.guid) {
    return <UserMenu user={user} />;
  }

  return (
    <>
      <Button
        className="bg-accent hover:bg-accent/80 font-bold"
        onClick={() => setShowSI(!showSI)}
      >
        Sign In
      </Button>
      {showSI && <SignIn closeFn={() => setShowSI(false)} />}
    </>
  );
}

function UserMenu({ user }: { user: User }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative size-10 rounded-full">
          <Avatar className="size-10">
            <AvatarFallback>
              <Iconskie className="size-full" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="flex items-center justify-between">
          My Account
          {user.phoneVerified && <BadgeCheck className="text-neu size-4" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">Tracked Sections</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()} variant="destructive">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
