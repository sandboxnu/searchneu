"use client";

import { SignIn } from "../SignIn";
import { Button } from "../ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Iconskie } from "../icons/Iconskie";
import { useAuth, signOut } from "@/lib/auth/client";

export function UserIcon() {
  const [showSI, setShowSI] = useState(false);
  const { user, isPending } = useAuth();

  if (!isPending && user.guid) {
    return <UserMenu />;
  }

  return (
    <>
      <Button
        className="bg-accent hover:bg-accent/80 h-9 rounded-full font-bold"
        onClick={() => setShowSI(!showSI)}
      >
        Sign In
      </Button>
      {showSI && <SignIn closeFn={() => setShowSI(false)} />}
    </>
  );
}

function UserMenu() {
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
        <DropdownMenuItem onClick={() => signOut()} variant="destructive">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
