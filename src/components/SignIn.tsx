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
import { Chairskie } from "./icons/Chairskie";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export function SignIn(props: { oneMoreStep?: boolean; closeFn: () => void }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const a = await authClient.signIn.social({
      provider: "github",
      // newUserCallbackURL: "/on",
      callbackURL: window.location.toString(),
    });
    console.log("a");
    console.log(JSON.stringify(a));
  }

  return (
    <Dialog onOpenChange={() => props.closeFn()} defaultOpen={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle>One More Step</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to be the first to know when seats open up.
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full items-center justify-center py-4">
          <Chairskie className="w-32" />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full"
            onClick={() => signIn()}
            disabled={loading}
          >
            {loading && <Loader2 />}
            Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
