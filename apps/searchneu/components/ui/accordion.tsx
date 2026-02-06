"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/cn";

type AccordionType = {
  title: string;
  description: string;
}
export default function FAQDropDown({title, description}: AccordionType) {
  return(
	<div className="rounded-lg self-stretch flex flex-col items-start p-[24px] gap-[16px] bg-neu1">
		<Accordion.Root type="single" collapsible className="w-full">
			<Accordion.Item value="item1">
				<Accordion.Header>
					<Accordion.Trigger className="flex items-center justify-between w-full data-[state=closed]:[&>span]:text-neu4 data-[state=open]:[&>span]:text-neu5 data-[state=closed]:text-neu7 data-[state=open]:text-neu8 data-[state=open]:text-neu8 data-[state=open]:[&>span]:duration-300 data-[state=open]:[&>span]:rotate-180 data-[state=closed]:[&>span]:duration-300 data-[state=closed]:[&>span]:rotate-0"> 
					<h4 className="leading-[24px] text-xl font-medium;">{title}</h4> 
					<span>
						<ChevronDownIcon/>
					</span>
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content className="mt-[16px] data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up data-[state=open]:animate-in data-[state=closed]:animate-out fade-in fade-out"> 
					<p className="leading-[19.2px] font-normal text-base text-neu7"> {description} </p>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</div>
  )
}