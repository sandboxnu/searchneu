"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "./Modal";
import FeedbackForm from "./FeedbackForm";

export default function FeedbackModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed right-0 bottom-56 flex origin-bottom-right rotate-[-90deg] flex-col rounded-t-sm bg-[#F15B50]">
        <button
          onClick={() => setOpen(!open)}
          className="bg-transparent px-4 py-1 text-white uppercase"
        >
          Feedback
        </button>
      </div>
      {open && (
        <Modal setOpen={setOpen}>
          <FeedbackForm />{" "}
        </Modal>
      )}
    </>
  );
}
