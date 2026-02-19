"use client";

import { ChevronDownIcon } from "lucide-react";
import { Accordion } from "radix-ui";

export interface AccordionType {
  title: string;
  description: string;
}

export function FAQDropDown({ title, description }: AccordionType) {
  return (
    <div className="bg-neu1 mb-[16px] flex flex-col items-start self-stretch rounded-lg p-[24px]">
      <Accordion.Root type="single" collapsible className="w-full">
        <Accordion.Item value="item1">
          <Accordion.Header>
            <Accordion.Trigger className="data-[state=closed]:[&>span]:text-neu4 data-[state=open]:[&>span]:text-neu5 data-[state=closed]:text-neu7 data-[state=open]:text-neu8 data-[state=open]:text-neu8 flex w-full items-center justify-between data-[state=closed]:[&>span]:rotate-0 data-[state=closed]:[&>span]:duration-300 data-[state=open]:[&>span]:rotate-180 data-[state=open]:[&>span]:duration-300">
              <h4 className="text-left text-xl leading-[24px] font-medium">
                {title}
              </h4>
              <span>
                <ChevronDownIcon />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up data-[state=open]:animate-in data-[state=closed]:animate-out fade-in fade-out mt-[16px]">
            <p className="text-neu7 text-base leading-[19.2px] font-normal">
              {description}
            </p>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}
