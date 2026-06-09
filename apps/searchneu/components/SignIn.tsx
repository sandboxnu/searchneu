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
import { GoogleLogo } from "./icons/Google";
import Link from "next/link";
import { Magoskie } from "./icons/Magoskie";
import { authClient } from "@/lib/auth/auth-client";

export function SignIn({
  closeFn,
  redirectUrl = "/",
}: {
  closeFn: () => void;
  redirectUrl?: string;
}) {
  const [isPending, setIsPending] = useState(false);

  async function doSignIn() {
    setIsPending(true);
    const onboardingUrl = `/me/link?redirect_uri=${encodeURIComponent(redirectUrl)}`;
    await authClient.signIn.social({
      provider: "google",
      newUserCallbackURL: onboardingUrl,
      callbackURL: redirectUrl,
    });
  }

  return (
    <Dialog onOpenChange={() => closeFn()} defaultOpen={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Sign in to access all SearchNEU features! We currently only support
            valid <span className="font-bold">husky.neu.edu</span>{" "}
            accounts.{" "}
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full items-center justify-center">
          <Magoskie className="w-32" />
        </div>
        <DialogDescription>
          By signing up, you agree to our{" "}
          <Link
            href="/terms"
            className="text-blue hover:text-blue/80 underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-blue hover:text-blue/80 underline"
          >
            Privacy Policy
          </Link>
        </DialogDescription>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full"
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
