"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { MoneyHusky } from "./icons/MoneyHusky";

export default function GivingDayModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("giving-day-modal-shown")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem("giving-day-modal-shown", "true");
    setOpen(false);
  };

  const handleClickDonate = () => {
    window.open(
      "http://tinyurl.com/sandbox-giving-day",
      "_blank",
      "noopener,noreferrer",
    );
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="flex w-xs flex-col items-center text-center"
        aria-description="Giving Day Modal"
        aria-describedby="test"
      >
        <MoneyHusky />
        <DialogTitle className="text-neu9 text-lg font-bold">
          It&apos;s Giving Day!
        </DialogTitle>
        <p className="text-neu9 text-sm">
          Make a donation to Sandbox to help keep SearchNEU running!
        </p>
        <button
          className="bg-red inline-flex cursor-pointer items-center gap-1 rounded-3xl px-26 py-2 text-center text-white"
          onClick={handleClickDonate}
        >
          Donate
        </button>
        <button
          className="text-neu9 text-bold cursor-pointer"
          onClick={handleClose}
        >
          Maybe Later
        </button>
      </DialogContent>
    </Dialog>
  );
}
