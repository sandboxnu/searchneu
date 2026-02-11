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
import { authClient } from "@/lib/auth-client";

export function UserIcon() {
  const [showSI, setShowSI] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  if (!isPending && session) {
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative hidden size-10 rounded-full md:flex"
          >
            <Avatar className="size-10">
              <AvatarFallback>
                <Iconskie className="size-full" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => authClient.signOut()}
            variant="destructive"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex w-full min-w-0 gap-4 md:hidden">
        <Avatar className="size-10">
          <AvatarFallback>
            <Iconskie className="size-full" />
          </AvatarFallback>
        </Avatar>
        <Button
          variant="destructive"
          className="bg-neu1 border-red text-red hover:bg-r1/30 h-10 w-full flex-1 rounded-full border"
          onClick={() => authClient.signOut()}
        >
          Sign Out
        </Button>
      </div>
    </>
  );
}
