"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendFeedbackToSlack } from "./slack-action";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import { Modal } from "@/components/feedback/Modal";

export default function Page() {
  return <FeedbackForm />;
}
