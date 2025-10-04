"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Toggle() {
  const router = useRouter();
  const openModal = () => {
    router.push("/feedback");
  };

  return (
    <div className="fixed right-0 bottom-56 flex origin-bottom-right rotate-[-90deg] flex-col rounded-t-sm bg-[#F15B50]">
      <button
        onClick={openModal}
        className="bg-transparent px-4 py-1 text-white uppercase"
      >
        Feedback
      </button>
    </div>
  );
}
