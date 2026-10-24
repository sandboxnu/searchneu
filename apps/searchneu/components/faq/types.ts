import type { CarouselItem } from "@/components/ui/carousel";

/**
 * A How-To Card is either a Carousel-type guide (multiple steps, navigated via Back/Next buttons)
 * or a Video-type guide (a single embedded video). The type is decided once per card by content.
 */
interface BaseHowTo {
  img: string;
  title: string;
  description: string;
}

export interface CarouselHowTo extends BaseHowTo {
  type: "carousel";
  carouselItems: CarouselItem[];
}

export interface VideoHowTo extends BaseHowTo {
  type: "video";
  videoId: string;
}

export type HowTo = CarouselHowTo | VideoHowTo;
