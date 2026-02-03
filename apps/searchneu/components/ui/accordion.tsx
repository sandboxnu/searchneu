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
	<div className="rounded-lg gap-[16px] self-stretch flex flex-col items-start p-[24px] bg-[#FFFFFF]">
		<Accordion.Root type="single" collapsible className="w-full">
			<Accordion.Item value="item1">
				<Accordion.Header>
					<Accordion.Trigger className="flex items-center justify-between w-full"> 
					<h4 className="text-xl font-medium text-[#5F5F5F];">{title}</h4> 
					<ChevronDownIcon color="#C2C2C2"/>
					</Accordion.Trigger>
				</Accordion.Header>
				<Accordion.Content> 
					<p className="text-base"> {description} </p>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</div>
  )
}