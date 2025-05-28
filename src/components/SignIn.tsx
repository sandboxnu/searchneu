"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth/client";
import { GoogleLogo } from "./icons/Google";
import Link from "next/link";
import { Magoskie } from "./icons/Magoskie";

export function SignIn({ closeFn }: { closeFn: () => void }) {
  const [isPending, setIsPending] = useState(false);

  async function doSignIn() {
    setIsPending(true);
    signIn();
  }

  return (
    <Dialog onOpenChange={() => closeFn()} defaultOpen={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to be the first to know when seats open up! We currently
            only support valid <span className="font-bold">husky.neu.edu</span>{" "}
            accounts.{" "}
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full items-center justify-center py-4">
          <Magoskie className="w-32" />
        </div>
        <DialogDescription className="text-center">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="text-b2 underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-b2 underline">
            Privacy Policy
          </Link>
        </DialogDescription>
        <DialogFooter>
          <Button
            type="submit"
            className="bg-accent hover:bg-accent/80 w-full"
            onClick={() => doSignIn()}
            disabled={isPending}
          >
            {isPending && <Loader2 className="animate-spin" />}
            Sign in with{" "}
            <span className="bg-neu1 rounded p-0.5">
              <GoogleLogo className="" />
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
