"use client";

import { useSyncExternalStore } from "react";

// Matches Tailwind's `sm` breakpoint (640px)
const SMALL_SCREEN_QUERY = "(max-width: 639.98px)";

function subscribe(callback: () => void) {
    const mql = window.matchMedia(SMALL_SCREEN_QUERY);
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
}

export function useIsSmallScreen() {
    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(SMALL_SCREEN_QUERY).matches,
        () => false,
    );
}