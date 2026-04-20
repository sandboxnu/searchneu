"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FAQDropDown } from "@/components/ui/accordion";

interface FAQ {
  id: number;
  title: string;
  description: string;
  sections?: { heading: string; body: string }[];
}

export interface FAQTab {
  label: string;
  faqs: FAQ[];
}

export function FAQTabs({ tabs }: { tabs: FAQTab[] }) {
  const defaultValue = tabs[0]?.label.toLowerCase() ?? "";

  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList className="mb-4 ml-4 h-auto gap-4 rounded-none border-b border-neutral-300 bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.label}
            value={tab.label.toLowerCase()}
            className="text-neu4 data-[state=active]:text-neu7 -mb-px h-auto cursor-pointer rounded-none border-b border-transparent px-0 py-1 text-xs font-bold tracking-normal uppercase data-[state=active]:border-neutral-500 data-[state=active]:bg-transparent"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.label} value={tab.label.toLowerCase()}>
          <div className="pl-4">
            {tab.faqs.map((faq) => (
              <FAQDropDown
                key={faq.id}
                title={faq.title}
                description={faq.description}
                sections={faq.sections}
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
