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
import { Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { GoogleLogo } from "./icons/Google";

export function SignIn(props: { oneMoreStep?: boolean; closeFn: () => void }) {
  const [loading, setLoading] = useState(false);

  async function doSignIn() {
    setLoading(true);
    signIn();
  }

  return (
    <Dialog onOpenChange={() => props.closeFn()} defaultOpen={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle>One More Step</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to be the first to know when seats open up! Note that we
            currently only support valid{" "}
            <span className="font-bold">husky.neu.edu</span> email addresses
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full items-center justify-center py-4">
          <Chairskie className="w-32" />
        </div>
        <DialogFooter>
          <Button
            type="submit"
            className="w-full"
            onClick={() => doSignIn()}
            disabled={loading}
          >
            {loading && <Loader2 />}
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
