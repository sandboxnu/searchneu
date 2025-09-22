"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendFeedbackToSlack } from "./slack-action";
import FeedbackForm from "@/components/feedbackPage/FeedbackForm";
import { Modal } from "@/components/feedbackPage/Modal";

export default function Page() {
  return <FeedbackForm />;
}
