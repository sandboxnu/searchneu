"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FeedbackFormHusky } from "../icons/FeedbackFormHusky";
import { sendFeedbackToSlack } from "@/app/(app)/feedback/slack-action";

export default function FeedbackForm() {
  const [feedbackType, setFeedbackType] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      const res = await sendFeedbackToSlack(feedbackType, message, contact);
      if (res == 200) {
        setMessage("");
        setContact("");
        setFeedbackType("");
        setSuccess(true);
        setSubmitting(false);
      }
    } finally {
      setSubmitting(true);
    }
  }

  if (success) {
    return (
      <div className="mb-12 flex h-[60vh] min-h-[600px] flex-col items-center justify-center gap-6">
        <FeedbackFormHusky />
        <div className="m-0 flex flex-col gap-3">
          <h1 className="text-center text-lg/[1] font-bold"> Submitted!</h1>
          <p className="text-center text-sm/[1] text-gray-500">
            Thank you for feeding our (big) backs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="flex h-[60vh] min-h-[600px] flex-col gap-6 space-y-4 overflow-scroll"
      >
        <div className="m-auto">
          <FeedbackFormHusky />
        </div>
        <div className="m-0 flex flex-col gap-3">
          <h1 className="text-lg/tight font-bold"> Feedback Form</h1>
          <p className="text-sm/tight text-gray-500">
            Found a bug? Search’s #1 fan? Let our devs know through this form.
          </p>
        </div>
        <div className="mb-0">
          <div className="mb-1 text-xs font-medium tracking-wide">
            TYPE OF FEEDBACK <span className="text-red-500">*</span>
          </div>
          <Select value={feedbackType} onValueChange={setFeedbackType}>
            <SelectTrigger className="h-9 w-full border border-gray-300">
              <SelectValue placeholder="Bug Report" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug-report">Bug Report</SelectItem>
              <SelectItem value="feature-request">Feature Request</SelectItem>
              <SelectItem value="general-feedback">General Feedback</SelectItem>
              <SelectItem value="compliment">Compliment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-0 flex h-full flex-col">
          <div className="mb-1 text-xs font-medium tracking-wide uppercase">
            DESCRIPTION <span className="text-red-500">*</span>
          </div>
          <Textarea
            placeholder="Say more about bugs, suggestions, etc."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="h-full resize-none text-sm"
            required
          />
        </div>
        <div className="border-border m-0 border-t" />

        <div>
          <div className="mb-1 text-xs font-medium tracking-wide uppercase">
            EMAIL (OPTIONAL)
          </div>
          <Input
            type="email"
            placeholder="How should we contact you?"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="m-auto h-9 w-1/4 bg-red-500 font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </>
  );
}
