"use client";
import { useFeedback } from "@/components/feedback/FeedbackContext";

/** A FAQ link that opens the feedback modal. */
export function FeedbackLink({ children }: { children: React.ReactNode }) {
    const { openFeedback } = useFeedback();
    return (
        <button
            type="button"
            onClick={openFeedback}
            className="hover:text-r5 cursor-pointer underline underline-offset-2 transition-colors"
        >
            {children}
        </button>
    );
}