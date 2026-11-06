"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { buttonVariants } from "./ui/button";
import { Magoskie } from "./icons/Magoskie";
import { cn } from "@/lib/cn";

// Matches Tailwind's `sm` breakpoint (640px)
const SMALL_SCREEN_QUERY = "(max-width: 639.98px)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(SMALL_SCREEN_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function useIsSmallScreen() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(SMALL_SCREEN_QUERY).matches,
    () => false,
  );
}

/**
 * Non-dismissible dialog shown on small screens for pages that are not
 * usable on mobile. Pair with `hidden sm:block` on the page contents.
 */
export function DesktopOnlyDialog({ feature }: { feature: string }) {
  const isSmall = useIsSmallScreen();

  return (
    <Dialog open={isSmall}>
      <DialogContent showCloseButton={false} className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Screen too small</DialogTitle>
          <DialogDescription>
            {feature} isn&apos;t available on small screens yet. Please switch
            to a larger device or widen your window to use it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full items-center justify-center">
          <Magoskie className="w-32" />
        </div>
        <DialogFooter>
          <Link href="/" className={cn(buttonVariants(), "w-full")}>
            Back to home
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
