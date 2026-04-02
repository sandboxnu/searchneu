"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface FeedbackContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openFeedback = useCallback(() => setOpen(true), []);

  return (
    <FeedbackContext.Provider value={{ open, setOpen, openFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
