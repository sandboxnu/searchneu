"use client";

import { useEffect } from "react";
import { toast, Toaster } from "sonner";
import FeedbackModal from "@/components/feedback/FeedbackModal";
import { X } from "lucide-react";
import { SadHusky } from "./icons/SadHusky";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!sessionStorage.getItem("summer-delay-shown")) {
      toast("Summer course catalog delayed :(", {
        description: "We are working to get them to you soon.",
        position: "bottom-left",
        icon: <SadHusky />,
        cancel: {
          label: <X size={20} color="#F15B50" className="h-[16px] w-[16px]" />,
          onClick: () => {},
        },
      });
      sessionStorage.setItem("summer-delay-shown", "true");
    }
  }, []);

  return (
    <div>
      <main className="min-h-[100dvh] w-screen grow">{children}</main>
      <FeedbackModal />
      <Toaster
        toastOptions={{
          classNames: {
            toast:
              "!border-l-8 !border-l-[#F15B50] !text-[13px] !w-[322px] !h-[64px]",
            cancelButton: "!bg-white !p-0",
            icon: "!w-[35.77px] !h-[32.95px]",
            description: "!text-[11px] !-mt-1",
          },
        }}
      />
    </div>
  );
}
