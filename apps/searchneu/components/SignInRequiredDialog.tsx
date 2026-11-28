"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Magoskie } from "@/components/icons/Magoskie";
import { SignIn } from "@/components/SignIn";
import { authClient } from "@/lib/auth/auth-client";
import { useIsSmallScreen } from "@/components/useIsSmallScreen";

/**
 * This is a dialog box shown to signed-out users on pages that require sign-in. Mirrors the
 * pattern of `DesktopOnlyDialog` but gated on sign-in status instead of screen size. It also does
 * not open on a small screen, so the two dialogs don't stack.
 *
 * It has a field, `redirectOnDismissTo`, for pages with no guest-mode experience, "maybe later"
 * navigates to the redirect. Omitted for pages with an existing guest-mode, where "maybe later"
 * just closes the dialog box.
 */
export function SignInRequiredDialog({
                                         feature,
                                         redirectOnDismissTo,
                                     }:
                                     {
                                         feature: string;
                                         redirectOnDismissTo?: string;
                                     }) {
    const { data: session, isPending } = authClient.useSession();
    const isSmallScreen = useIsSmallScreen();
    const pathname = usePathname();
    const router = useRouter();

    const [dismissed, setDismissed] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);

    const signedIn = isPending || session;
    const open = !signedIn && !isSmallScreen && !dismissed;

    function handleMaybeLater() {
        setDismissed(true);
        if (redirectOnDismissTo) {
            router.replace(redirectOnDismissTo);
        }
    }

    function handleSignInClick() {
        setDismissed(true);
        setShowSignIn(true);
    }

    return (
        <>
            <Dialog open={open}>
                <DialogContent showCloseButton={false} className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>Sign in to use {feature}</DialogTitle>
                        <DialogDescription>
                            {feature} requires a signed-in account. Sign in to get started, or come
                            back later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex w-full items-center justify-center">
                        <Magoskie className="w-32" />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="w-full" onClick={handleMaybeLater}>
                            Maybe later
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {showSignIn && (
                <SignIn redirectUrl={pathname} closeFn={() => setShowSignIn(false)} />
            )}
        </>
    );
}
