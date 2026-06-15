"use client";

import * as React from "react";

// Lets popups (combobox/select) portal into a specific container instead of
// `document.body`. This matters inside a vaul drawer: when popups live outside
// the drawer's DOM, vaul's modal touch handling treats them as background,
// which blocks scrolling the list and makes the drawer jump around. Providing
// the drawer as the container keeps popups inside it so they scroll normally.
const PortalContainerContext = React.createContext<
  HTMLElement | null | undefined
>(undefined);

export function PortalContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <PortalContainerContext.Provider value={container}>
      {children}
    </PortalContainerContext.Provider>
  );
}

export function usePortalContainer() {
  // Coerce `null` to `undefined` so Base UI's portal falls back to
  // `document.body`. Base UI treats an explicit `null` container as "not
  // resolved yet" and never renders the popup, whereas `undefined` triggers
  // the `document.body` fallback. This covers both the no-provider case and
  // the drawer's transient `null` before its container ref mounts.
  return React.useContext(PortalContainerContext) ?? undefined;
}
