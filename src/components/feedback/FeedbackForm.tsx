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
import { sendFeedbackToSlack } from "@/lib/feedback/slack-action";
import { SuccessHusky } from "../icons/SuccessHusky";

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
      <div className="mb-12 flex flex-col justify-center gap-6">
        <div className="flex flex-col items-center gap-6">
          <SuccessHusky />
          <div className="m-0 flex flex-col gap-2">
            <h1 className="text-neu9 text-center text-lg/[1] font-bold">
              Submitted!
            </h1>
            <p className="text-neu7 text-center text-sm/[1]">
              Thank you for feeding our (big) backs.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-9 flex flex-col gap-6 overflow-x-hidden"
    >
      <div className="flex justify-center">
        <FeedbackFormHusky />
      </div>
      <div className="m-0 flex flex-col gap-3">
        <h1 className="text-neu8 text-lg/tight font-bold"> Feedback Form</h1>
        <p className="text-neu6 text-sm/tight">
          Found a bug? Search’s #1 fan? Let our devs know through this form.
        </p>
      </div>
      <div className="mb-0">
        <div className="text-neu7 mb-1 text-xs font-bold">
          TYPE OF FEEDBACK <span className="text-r4">*</span>
        </div>
        <div className="relative">
          <Select value={feedbackType} onValueChange={setFeedbackType}>
            <SelectTrigger className="border-neu25 h-9 w-full bg-white font-bold text-black">
              <SelectValue placeholder="Select feedback type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bug-report">Bug Report</SelectItem>
              <SelectItem value="feature-request">Feature Request</SelectItem>
              <SelectItem value="general-feedback">General Feedback</SelectItem>
              <SelectItem value="compliment">Compliment</SelectItem>
            </SelectContent>
          </Select>

          {/* Hidden select for native form validation */}
          <select
            required
            value={feedbackType}
            onChange={() => {}}
            className="pointer-events-none absolute inset-0 opacity-0"
            tabIndex={-1}
          >
            <option value="">Select...</option>
            <option value="bug-report">Bug Report</option>
            <option value="feature-request">Feature Request</option>
            <option value="general-feedback">General Feedback</option>
            <option value="compliment">Compliment</option>
          </select>
        </div>
      </div>

      <div className="mb-0 flex flex-1 flex-col">
        <div className="text-neu7 mb-1 text-xs font-bold">
          DESCRIPTION <span className="text-r4">*</span>
        </div>
        <Textarea
          placeholder="Say more about bugs, suggestions, etc."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="h-full max-h-32 w-full resize-none rounded-xl text-sm"
          required
        />
      </div>
      <div className="border-neu4 border-t-[0.5px]" />

      <div className="mb-0">
        <div className="text-neu7 mb-1 text-xs font-bold">EMAIL (OPTIONAL)</div>
        <Input
          type="email"
          placeholder="How should we contact you?"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="h-9 overflow-scroll text-sm"
        />
      </div>
      <div className="m-auto">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-neu hover:bg-neu/80 text-neu1 m-auto rounded-full px-6 py-3 font-bold"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </form>
  );
}
