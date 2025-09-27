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

export default function FeedbackForm() {
  const [feedbackType, setFeedbackType] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Mock function - replace with your actual implementation
  const sendFeedbackToSlack = async (message: string, contact: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Sending to Slack:", { message, contact });
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await sendFeedbackToSlack(message, contact);
      setMessage("");
      setContact("");
      setFeedbackType("");
      setIsOpen(false); // Close form after successful submission
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="relative w-full">
      {/* Close button */}

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <div className="text-xl">
            <FeedbackFormHusky />
          </div>
        </div>
        <h2 className="mb-2 text-lg font-semibold">Feedback Form</h2>
        <p className="text-sm text-gray-600">
          Found a bug? Search's #1 fan? Let our devs know through this form.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <div className="mb-1 text-xs font-medium tracking-wide uppercase">
            TYPE OF FEEDBACK <span className="text-red-500">*</span>
          </div>
          <Select value={feedbackType} onValueChange={setFeedbackType}>
            <SelectTrigger className="h-9">
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

        <div>
          <div className="mb-1 text-xs font-medium tracking-wide uppercase">
            DESCRIPTION <span className="text-red-500">*</span>
          </div>
          <Textarea
            placeholder="Say more about bugs, suggestions, etc."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
            required
          />
        </div>

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
          className="h-9 w-full bg-red-500 font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </div>
  );
}
