"use client";

import FeedbackModal from "@/components/feedback/FeedbackModal";
import { FeedbackProvider } from "@/components/feedback/FeedbackContext";
import { X } from "lucide-react";
import { useEffect } from "react";
import { HappyHusky } from "./icons/HappyHusky";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/toaster";
// import dynamic from "next/dynamic";

// const GivingDayModal = dynamic(() => import("./GivingDayModal"), {
//   ssr: false,
// });

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!sessionStorage.getItem("summer-delay-shown")) {
      toast("Giving Day is coming up on April 10th!", {
        description: (
          <>
            Please donate to Sandbox{" "}
            <a
              href="http://tinyurl.com/sandbox-giving-day"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "underline" }}
            >
              here
            </a>{" "}
            to help keep SearchNEU running!
          </>
        ),
        position: "bottom-left",
        icon: <HappyHusky />,
        cancel: {
          label: <X size={20} color="#F15B50" className="h-[16px] w-[16px]" />,
          onClick: () => {},
        },
      });
      sessionStorage.setItem("summer-delay-shown", "true");
    }
  }, []);

  return (
    <FeedbackProvider>
      <div>
        <main className="min-h-[100dvh] w-screen grow">{children}</main>
        <FeedbackModal />
        <Toaster
          toastOptions={{
            classNames: {
              toast:
                "!border-l-8 !border-l-r4 !text-[13px] !w-[450px] !h-[64px]",
              cancelButton: "!bg-white !p-0",
              icon: "!w-[35.77px] !h-[32.95px]",
              description: "!text-[11px] !-mt-1",
            },
          }}
        />
        {/* <GivingDayModal /> */}
      </div>
    </FeedbackProvider>
  );
}
