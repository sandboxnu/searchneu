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
import { useRouter } from "next/navigation";

export function SignIn(props: { oneMoreStep?: boolean; closeFn: () => void }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn() {
    setLoading(true);
    router.push("/api/auth/google");
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
