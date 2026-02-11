import faqData from "../../faqs.json"
import howToData from "../../howto.json"
import { FAQDropDown, type AccordionType } from '@/components/ui/accordion';
import { Card, type CardProps } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Header } from "@/components/navigation/Header";

export default function Page() {
    return (
        <div className="min-h-screen pt-4 pb-6">
            <Header />
            <div className="p-8" style={{ paddingLeft: '152px', paddingRight: '152px' }}>
                <h2 className="mb-4 text-2xl font-bold text-[#5F5F5F] text-[28px] pl-4">How-to Guides</h2>
                <ScrollArea className="mb-4 w-full whitespace-nowrap">
                    <div className="flex w-max space-x-4 p-4">
                        {howToData.howtos.map((howto: CardProps) => <Card img={howto.img} title={howto.title} description={howto.description} />)}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                <h2 className="mb-4 text-2xl font-bold text-[#5F5F5F] text-[28px] pl-4">FAQs</h2>
                <div className="pl-4">
                    {faqData.faqs.map((faq: AccordionType) => <FAQDropDown title={faq.title} description={faq.description} />)}
                </div>
            </div>
        </div>
    );
}
