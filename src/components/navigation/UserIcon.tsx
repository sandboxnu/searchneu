"use client";
import { useAuth } from "@/lib/context/auth-context";
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

export function UserIcon() {
  const [showSI, setShowSI] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {user ? (
        <UserMenu />
      ) : (
        <Button className="font-bold" onClick={() => setShowSI(!showSI)}>
          Sign In
        </Button>
      )}
      {showSI && <SignIn closeFn={() => setShowSI(false)} />}
    </>
  );
}

function UserMenu() {
  const { signOut } = useAuth();

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
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">Subscriptions</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} variant="destructive">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
