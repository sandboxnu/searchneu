"use client";
import { useState } from "react";
import Image from "next/image";
import { Carousel, CarouselItem } from "@/components/ui/carousel";

type HowTo = {
  id: number;
  img: string;
  title: string;
  description: string;
  carouselItems: CarouselItem[];
};

function HowToCard({ howto }: { howto: HowTo }) {
  const [open, setOpen] = useState(false);
  const firstWord = howto.title.split(" ")[0];
  const restOfTitle = howto.title.split(" ").slice(1).join(" ");

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group relative z-10 flex h-78 w-108.5 min-w-xs cursor-pointer flex-col items-start gap-6 overflow-hidden rounded-lg border bg-[#FFF] p-2 pb-6 hover:border-none hover:shadow-[0px_4px_8px_2px_#a6a6a61f]"
      >
        <div className="group-hover:bg-r1 absolute top-0 h-109 w-109 -translate-y-1/3 rounded-full blur-[80px] group-hover:opacity-60" />
        <Image
          src={howto.img}
          width={700}
          height={700}
          alt="how to image"
          className="bg-opacity-60 rounded-5 relative h-45.5 w-104.5 bg-gray-100"
        />
        <div className="card-container relative flex flex-col items-start gap-4 self-stretch px-4">
          <h4 className="card-title text-r5 h-3.5 pl-1 text-xl leading-6 font-semibold">
            {firstWord} <span className="text-neu8">{restOfTitle}</span>
          </h4>
          <p className="card-description text-neu7 pr-3 pl-1 text-sm leading-[16.8px] whitespace-normal">
            {howto.description}
          </p>
        </div>
      </div>
      <Carousel
        items={howto.carouselItems}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

export { HowToCard };
export type { HowTo };
