"use client";
import { useState } from "react";
import Image from "next/image";
import { ArrowRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type CarouselItem = {
  img: string;
  title: string;
  description: string;
};

type CarouselProps = {
  items: CarouselItem[];
  open: boolean;
  onOpenChange: (val: boolean) => void;
};

function Carousel({ items, open, onOpenChange }: CarouselProps) {
  const [step, setStep] = useState(0);

  const current = items[step];
  const firstWord = current.title.split(" ")[0];
  const restOfTitle = current.title.split(" ").slice(1).join(" ");
  const isLast = step === items.length - 1;

  function handleOpenChange(val: boolean) {
    if (!val) {
      setTimeout(() => setStep(0), 200);
    }
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-neu1 h-158 gap-0 rounded-xl sm:max-w-178"
      >
        <DialogClose className="bg-neu3 text-neu8 absolute -right-9 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full shadow ring-0 outline-none">
          <X size={20} strokeWidth={2.3} />
        </DialogClose>
        <Image
          src={current.img}
          width={664}
          height={400}
          alt={current.title}
          className="bg-neu3 w-full rounded-lg object-cover"
        />
        <div className="flex flex-col gap-3">
          <DialogTitle className="text-r5 text-3xl leading-6 font-semibold">
            {firstWord} <span className="text-neu8">{restOfTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-neu7 text-lg leading-tight">
            {current.description}
          </DialogDescription>
          <div className="relative mt-5 flex items-center justify-center">
            <div className="flex gap-1.5">
              {items.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors ${i === step ? "bg-neu8" : "bg-neu4"}`}
                />
              ))}
            </div>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="border-neu3 bg-neu2 text-neu6 absolute left-0 flex cursor-pointer items-center gap-1.5 rounded-2xl border px-4 py-2 text-sm font-bold"
              >
                Back
              </button>
            )}
            <button
              onClick={() =>
                isLast ? handleOpenChange(false) : setStep((s) => s + 1)
              }
              className="bg-r1/30 text-red border-r1 absolute right-0 flex cursor-pointer items-center gap-1.5 rounded-2xl border px-4 py-2 text-sm font-bold"
            >
              {isLast ? "Finish" : "Next"} <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { Carousel };
export type { CarouselItem };
