"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendFeedbackToSlack } from "@/app/(app)/feedback/slack-action";

export default function FeedbackForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await sendFeedbackToSlack(message, contact);
      setMessage("");
      setContact("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Search NEU Contact Form</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <p className="text-neu10 text-base">
            Find a bug in Search NEU? Find a query that doesn&apos;t come up
            with the results you were looking for? Have an idea for an
            improvement or just want to say hi? Drop a line below. Feel free to
            write whatever you want and someone on the team will read it.
          </p>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="Write your message..."
            className="border-neu4 focus-visible:border-neu focus-visible:ring-neu/50 min-h-40 w-full rounded-xl border bg-transparent p-3 text-base outline-none focus-visible:ring-[3px]"
          />
        </div>

        <div className="space-y-2">
          <p className="text-neu10 text-base">
            By default this form is anonymous. Leave your name and/or email if
            you want us to be able to contact you.
          </p>
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Name or email (optional)"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !message.trim()}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
