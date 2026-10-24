"use client";
import { useState, useRef, useEffect } from "react";
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
  const wheelCooldown = useRef(false);

  const isLast = step === items.length - 1;

  function handleOpenChange(val: boolean) {
    if (!val) {
      setTimeout(() => setStep(0), 200);
    }
    onOpenChange(val);
  }

  function handleWheel(e: React.WheelEvent) {
    // ignoring minor trackpad movements
    if (wheelCooldown.current) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    if (Math.abs(e.deltaX) < 20) return;

    e.preventDefault();

    if (e.deltaX > 0 && !isLast) setStep((s) => s + 1);
    if (e.deltaX < 0 && step > 0) setStep((s) => s - 1);

    wheelCooldown.current = true;
    setTimeout(() => {
      wheelCooldown.current = false;
    }, 1000);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-neu1 flex h-158 flex-col gap-5 overscroll-x-none rounded-xl sm:max-w-178"
        onWheel={handleWheel}
      >
        <DialogClose className="bg-neu3 text-neu8 absolute -right-9 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full shadow ring-0 outline-none">
          <X size={20} strokeWidth={2.3} />
        </DialogClose>

        <div className="border-neu3 aspect-[216/127] w-full shrink-0 overflow-hidden rounded-lg border">
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${step * 100}%)` }}
          >
            {items.map((item, i) => (
              <div key={i} className="h-full w-full shrink-0">
                <Image
                  src={item.img}
                  width={664}
                  height={400}
                  alt={item.title}
                  className="bg-neu3 h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="relative flex-1 overflow-hidden">
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${step * 100}%)` }}
            >
              {items.map((item, i) => {
                const firstWord = item.title.split(" ")[0];
                const restOfTitle = item.title.split(" ").slice(1).join(" ");
                return (
                  <div key={i} className="flex w-full shrink-0 flex-col gap-3">
                    <DialogTitle className="text-r5 text-3xl leading-6 font-semibold">
                      {firstWord}{" "}
                      <span className="text-neu8">{restOfTitle}</span>
                    </DialogTitle>
                    <DialogDescription className="text-neu7 text-lg leading-tight">
                      {item.description}
                    </DialogDescription>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-auto flex h-9 items-center justify-center">
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
