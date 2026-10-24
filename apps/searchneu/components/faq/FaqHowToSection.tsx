"use client";
import { HowToCard } from "@/components/faq/how-to-card";
import { useRef, useState } from "react";
import type { HowTo } from "@/components/faq/types";

const GAP_PX = 16;

/**
 * Renders a horizontally scrollable row of "How To" cards, each summarizing
 * a key SearchNEU workflow (searching, filtering, subscribing) with a
 * linked carousel or video for step-by-step details.
 */
export function FaqHowToSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll() {
    const container = scrollRef.current;
    const card = firstCardRef.current;
    if (!container || !card) return;

    const cardFullWidth = card.offsetWidth + GAP_PX;
    const rawIndex = Math.round(container.scrollLeft / cardFullWidth);
    const clampedIndex = Math.min(Math.max(rawIndex, 0), HowTos.length - 1);
    setActiveIndex(clampedIndex);
  }

  return (
    <div className="mb-4 w-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto px-4 pt-3 pb-1 [-ms-overflow-style:none] min-[500px]:snap-none [&::-webkit-scrollbar]:hidden"
      >
        {HowTos.map((h, i) => (
          <div
            key={i}
            ref={i === 0 ? firstCardRef : undefined}
            className="shrink-0 snap-center"
          >
            <HowToCard howto={h} />
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-center gap-1.5 min-[500px]:hidden">
        {HowTos.map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === activeIndex ? "bg-neu8" : "bg-neu4"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

const HowTos: HowTo[] = [
  {
    type: "carousel",
    img: "/images/faq/how_to1.png",
    title: "Search for classes",
    description:
      "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
    carouselItems: [
      {
        img: "/images/faq/how_to_carousel_search_a.png",
        title: "Search for classes",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
      {
        img: "/images/faq/how_to_carousel_search_b.png",
        title: "Filter your search",
        description:
          "Narrow results by subject, campus, class type, or NUPath to zero in on exactly the sections that fit your schedule and requirements.",
      },
      {
        img: "/images/faq/how_to_carousel_search_c.png",
        title: "Subscribe to section notifications",
        description:
          "Found a section that's full? Subscribe for a text the moment a seat frees up, so you never have to keep refreshing the page yourself.",
      },
    ],
  },
  {
    type: "video",
    img: "/images/faq/how_to1.png",
    title: "Demo placeholder text",
    description:
      "Take a quick look at our walkthrough of the site, and understand all the tools we have made to be at your disposal.",
    videoId: "hdsGQYYgrbs",
  },
  {
    type: "carousel",
    img: "/images/faq/how_to_plan.png",
    title: "Plan your class schedule",
    description:
      "Decided what classes you need, found the sections, but not sure if you can figure out all the possible time and section combinations? Use our scheduler!",
    carouselItems: [
      {
        img: "/images/faq/how_to_carousel_plan_a.png",
        title: "Generate all possible class schedules",
        description:
          "Add the courses you know you're going to take, and simply hold the power to generate every possible schedule combination across sections at the press of a button.",
      },
      {
        img: "/images/faq/how_to_carousel_plan_b.png",
        title: "Choose the one right for you",
        description:
          "Filter from sections, narrow down times, favourite plans and approach the perfect plan with ease, one step at a time.",
      },
    ],
  },
];
