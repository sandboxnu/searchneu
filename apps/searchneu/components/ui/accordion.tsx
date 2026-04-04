"use client";

import { ChevronDownIcon } from "lucide-react";
import { Accordion } from "radix-ui";

export interface FAQSection {
  heading: string;
  body: string;
}

export interface AccordionType {
  title: string;
  description: string;
  sections?: FAQSection[];
}

export function FAQDropDown({ title, description, sections }: AccordionType) {
  return (
    <div className="mb-4 flex flex-col items-start self-stretch rounded-lg bg-[#FFF] p-6">
      <Accordion.Root type="single" collapsible className="w-full">
        <Accordion.Item value="item1">
          <Accordion.Header>
            <Accordion.Trigger className="data-[state=closed]:[&>span]:text-neu4 data-[state=open]:[&>span]:text-neu5 data-[state=closed]:text-neu7 data-[state=open]:text-neu8 data-[state=open]:text-neu8 flex w-full cursor-pointer items-center justify-between data-[state=closed]:[&>span]:rotate-0 data-[state=closed]:[&>span]:duration-300 data-[state=open]:[&>span]:rotate-180 data-[state=open]:[&>span]:duration-300">
              <h4 className="text-left text-xl leading-6 font-medium">
                {title}
              </h4>
              <span>
                <ChevronDownIcon />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up fade-in fade-out mt-4">
            {description && (
              <p className="text-neu7 text-base leading-[19.2px] font-normal">
                {description}
              </p>
            )}
            {sections && (
              <div className="text-neu7 space-y-4 text-base leading-[19.2px] font-normal">
                {sections.map((section, i) => (
                  <div key={i}>
                    <p className="font-bold">{section.heading}</p>
                    {section.body && <p>{section.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}
