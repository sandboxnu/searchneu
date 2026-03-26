"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type CarouselItem = {
  carouselImg: string;
  title: string;
  description: string;
};

type CarouselProps = {
  items: CarouselItem[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (val: boolean) => void;
};

function Carousel({ items, initialIndex, open, onOpenChange }: CarouselProps) {
  const [step, setStep] = useState(initialIndex);

  useEffect(() => {
    if (!open) setStep(initialIndex);
  }, [open, initialIndex]);

  const current = items[step];
  const firstWord = current.title.split(" ")[0];
  const restOfTitle = current.title.split(" ").slice(1).join(" ");
  const isLast = step === items.length - 1;

  function handleOpenChange(val: boolean) {
    if (val) setStep(initialIndex);
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="w-[712px] sm:max-w-[712px] h-[632px] rounded-[12px] bg-carousel gap-0">
        <DialogClose className="absolute -right-9 h-[28px] w-[28px] rounded-full bg-carousel-gray text-neu8 shadow flex items-center justify-center outline-none ring-0 cursor-pointer">
          <X size={20} strokeWidth={2.3} />
        </DialogClose>
        <Image
          src={current.carouselImg}
          width={664}
          height={400}
          alt={current.title}
          className="w-full rounded-[8px] object-cover bg-neu3"
        />
        <div className="flex flex-col gap-3">
        <DialogTitle className="text-r5 text-[28px] font-semibold leading-6">
          {firstWord} <span className="text-neu8">{restOfTitle}</span>
        </DialogTitle>

          <DialogDescription className="text-neu7 text-[17px] leading-tight">{current.description}</DialogDescription>
          <div className="mt-5 relative flex items-center justify-center">
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
                className="absolute left-0 flex items-center gap-1.5 rounded-[20px] border-[1px] border-carousel-gray bg-carousel-back-background px-4 py-2 text-carousel-dark-gray text-sm font-bold cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              onClick={() => isLast ? onOpenChange(false) : setStep((s) => s + 1)}
              className="absolute right-0 flex items-center gap-1.5 rounded-[20px] bg-carousel-forward-background/30 px-4 py-2 text-sm font-bold text-carousel-red border-[1px] border-carousel-forward-background cursor-pointer"
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
