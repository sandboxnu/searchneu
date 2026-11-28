"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { SignIn } from "./SignIn";
import { authClient } from "@/lib/auth/auth-client";
import { useIsSmallScreen } from "./useIsSmallScreen";

export function SignInRequiredDialog({
                                         feature,
                                         description,
                                         redirectOnDismissTo,
                                     }: {
    feature: string;
    description: string;
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
            <Dialog
                open={open}
                onOpenChange={(val) => {
                    if (!val) handleMaybeLater();
                }}
            >
                <DialogContent className="sm:max-w-[636px] gap-6 rounded-lg px-6 pt-9 pb-6">
                    <DialogHeader>
                        <DialogTitle>Sign in to use {feature}</DialogTitle>
                        <DialogDescription className="whitespace-pre-line">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleMaybeLater}>
                            Maybe later
                        </Button>
                        <Button onClick={handleSignInClick}>Sign in</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {showSignIn && (
                <SignIn redirectUrl={pathname} closeFn={() => setShowSignIn(false)} />
            )}
        </>
    );
}