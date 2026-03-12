import faqData from "../../faqs.json";
import howToData from "../../howto.json";
import { FAQDropDown } from "@/components/ui/accordion";
import { HowToCard } from "@/components/ui/how-to-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] pt-4 pb-6">
      <div className="p-8 px-40">
        <h2 className="text-neu7 pl-4 text-2xl text-[28px] font-bold">
          How-to Guides
        </h2>
        <ScrollArea className="mb-4 w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 p-4 pt-3">
            {howToData.howtos.map((howto) => (
              <HowToCard
                key={howto.id}
                img={howto.img}
                title={howto.title}
                description={howto.description}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <h2 className="text-neu7 mb-4 pl-4 text-2xl text-[28px] font-bold">
          FAQs
        </h2>
        <div className="pl-4">
          {faqData.faqs.map((faq) => (
            <FAQDropDown
              key={faq.id}
              title={faq.title}
              description={faq.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
