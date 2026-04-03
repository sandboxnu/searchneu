"use client";

import FeedbackModal from "@/components/feedback/FeedbackModal";
import { FeedbackProvider } from "@/components/feedback/FeedbackContext";
import dynamic from "next/dynamic";

const GivingDayModal = dynamic(() => import("./GivingDayModal"), {
  ssr: false,
});

export function ClientLayout({ children }: { children: React.ReactNode }) {
  // useEffect(() => {
  //   if (!sessionStorage.getItem("summer-delay-shown")) {
  //     toast("Summer course catalog delayed :(", {
  //       description: "We are working to get them to you soon.",
  //       position: "bottom-left",
  //       icon: <SadHusky />,
  //       cancel: {
  //         label: <X size={20} color="#F15B50" className="h-[16px] w-[16px]" />,
  //         onClick: () => {},
  //       },
  //     });
  //     sessionStorage.setItem("summer-delay-shown", "true");
  //   }
  // }, []);

  return (
    <FeedbackProvider>
      <div>
        <main className="min-h-[100dvh] w-screen grow">{children}</main>
        <FeedbackModal />
        <GivingDayModal />
      </div>
    </FeedbackProvider>
  );
}
