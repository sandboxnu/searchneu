import { FaqAccordionSection } from "@/components/faq/FaqAccordionSection";
import { FaqHowToSection } from "@/components/faq/FaqHowToSection";
import { faqHowToFlag } from "@/lib/flags";

/**
 * FAQ Page
 */
export default async function Page() {
  const showHowTo = await faqHowToFlag();

  return (
    <div className="p-8 px-40">
      {showHowTo && (
        <>
          <h2 className="text-neu7 pl-4 text-2xl text-[28px] font-bold">
            How-to Guides
          </h2>
          <FaqHowToSection />
        </>
      )}
      <h2 className="text-neu7 mb-4 pl-4 text-2xl font-bold">FAQs</h2>
      <FaqAccordionSection />
    </div>
  );
}
