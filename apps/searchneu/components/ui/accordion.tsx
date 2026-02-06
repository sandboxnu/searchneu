"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/cn";

type AccordionType = {
  title: string;
  description: string;
};
export default function FAQDropDown({ title, description }: AccordionType) {
  return (
    <div className="bg-neu1 flex flex-col items-start gap-[16px] self-stretch rounded-lg p-[24px]">
      <Accordion.Root type="single" collapsible className="w-full">
        <Accordion.Item value="item1">
          <Accordion.Header>
            <Accordion.Trigger className="data-[state=closed]:[&>span]:text-neu4 data-[state=open]:[&>span]:text-neu5 data-[state=closed]:text-neu7 data-[state=open]:text-neu8 data-[state=open]:text-neu8 flex w-full items-center justify-between data-[state=closed]:[&>span]:rotate-0 data-[state=closed]:[&>span]:duration-300 data-[state=open]:[&>span]:rotate-180 data-[state=open]:[&>span]:duration-300">
              <h4 className="font-medium; text-xl leading-[24px]">{title}</h4>
              <span>
                <ChevronDownIcon />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content
            className={cn(
              "mt-4 overflow-hidden",
              "transition-all duration-300 ease-out",
              "data-[state=closed]:grid-rows-[0fr]",
              "data-[state=open]:grid-rows-[1fr]",
              "grid",
            )}
          >
            <div className="overflow-hidden">
              <p className="text-neu7 text-base leading-[19px] font-normal">
                {description}
              </p>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}
