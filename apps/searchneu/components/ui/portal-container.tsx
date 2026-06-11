"use client";

import * as React from "react";

// Lets popups (combobox/select) portal into a specific container instead of
// `document.body`. This matters inside a vaul drawer: when popups live outside
// the drawer's DOM, vaul's modal touch handling treats them as background,
// which blocks scrolling the list and makes the drawer jump around. Providing
// the drawer as the container keeps popups inside it so they scroll normally.
const PortalContainerContext = React.createContext<HTMLElement | null>(null);

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
  return React.useContext(PortalContainerContext);
}
