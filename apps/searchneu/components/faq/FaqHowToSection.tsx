import { HowToCard } from "@/components/faq/how-to-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

/**
 * Renders a horizontally scrollable row of "How To" cards, each summarizing
 * a key SearchNEU workflow (searching, filtering, subscribing) with a
 * linked carousel for step-by-step details.
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
        img: "/images/faq/how_to_carousel1.png",
        title: "Search for classes",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
      {
        img: "/images/faq/how_to_carousel1.png",
        title: "Filter your search",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
      {
        img: "/images/faq/how_to_carousel1.png",
        title: "Subscribe to section notifications",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
    ],
  },
  {
    img: "/images/faq/how_to1.png",
    title: "Filter your search",
    description:
      "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
    carouselItems: [
      {
        img: "/images/faq/how_to_carousel1.png",
        title: "Search for classes",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
      {
        img: "/images/faq/how_to_carousel1.png",
        title: "Filter your search",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
      {
        img: "/images/faq/how_to_carousel1.png",
        title: "Subscribe to section notifications",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
    ],
  },
  {
    img: "/images/faq/how_to1.png",
    title: "Subscribe to section notifications",
    description:
      "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
    carouselItems: [
      {
        img: "/images/faq/how_to_carousel1.png",
        title: "Search for classes",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
      {
        img: "/images/faq/how_to_carousel1.png",
        title: "Filter your search",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
      {
        img: "/images/faq/how_to_carousel1.png",
        title: "Subscribe to section notifications",
        description:
          "Don't know the full government name for Orgo or Fundies? SearchNEU does! Use our course catalog to easily find all of the courses you need for the upcoming registration cycle.",
      },
    ],
  },
];
