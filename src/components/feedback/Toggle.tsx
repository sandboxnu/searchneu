import Link from "next/link";

export default function Toggle() {
  return (
    <div className="fixed right-[-16px] bottom-5 flex rotate-[-90deg] flex-col bg-[#F15B50]">
      <Link className="bg-transparent px-1 py-4 uppercase" href="/feedback">
        Feedback
      </Link>
    </div>
  );
}
