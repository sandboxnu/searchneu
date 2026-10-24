import { HowToCard } from "@/components/faq/how-to-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

/**
 * Renders a horizontally scrollable row of "How To" cards, each summarizing
 * a key SearchNEU workflow (searching, filtering, subscribing) with a
 * linked carousel or video for step-by-step details.
 */
export function FaqHowToSection() {
  return (
    <ScrollArea className="mb-4 w-full whitespace-nowrap">
      <div className="flex w-max space-x-4 p-4 pt-3">
        {HowTos.map((h, i) => (
          <HowToCard key={i} howto={h} />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

const HowTos = [
  {
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
