"use client";

import { DesktopIcon } from "@/components/icons/Desktop";

export function FullScreenRequired() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-[#333] min-[1180px]:hidden">
      <DesktopIcon className="mb-3 h-[100px] w-[100px]" />
      <h2 className="mb-3 font-[Lato] text-[18px] leading-[13px] font-semibold text-white">
        Full Screen Required
      </h2>
      <p className="mb-3 text-center font-[Lato] text-[16px] leading-[20.8px] font-normal text-white">
        For the best experience, please use SearchNEU Scheduler on a larger
        screen.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="flex cursor-pointer items-center justify-center gap-[10px] rounded-lg bg-[#E63946] px-[20px] py-[12px] font-[Lato] text-[16px] leading-[12px] font-bold text-white hover:bg-[#d32f3c]"
      >
        Reload
      </button>
    </div>
  );
}
