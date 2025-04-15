"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

export function HomeSearch() {
  return (
    <div className="flex flex-col gap-2 rounded px-8 pt-8 pb-4 shadow-md">
      <div className="flex flex-col-reverse gap-1 md:flex-row md:gap-0">
        <ExSelect />
        <div className="flex w-full">
          <Input
            className="bg-background h-10 rounded-r-none md:rounded-none"
            placeholder="Search for a course, CRN, or phrase"
          />
          <Button size="icon" className="size-10 rounded-l-none shadow-sm">
            🔍
          </Button>
        </div>
      </div>
      <Link href="/202530" className="italic">
        See all courses
      </Link>
    </div>
  );
}

function ExSelect() {
  return (
    <Select defaultValue="202530">
      <SelectTrigger className="bg-background ring-0 data-[size=default]:h-10 md:w-40 md:rounded-r-none md:border-none xl:w-52">
        <SelectValue placeholder="Select term" />
      </SelectTrigger>
      <SelectContent className="">
        <SelectGroup>
          <SelectLabel>NEU</SelectLabel>
          <SelectItem value="202530">Spring 2025</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
          <SelectItem value="akst">Alaska Standard Time (AKST)</SelectItem>
          <SelectItem value="hst">Hawaii Standard Time (HST)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>CPS</SelectLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
          <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
          <SelectItem value="west">
            Western European Summer Time (WEST)
          </SelectItem>
          <SelectItem value="cat">Central Africa Time (CAT)</SelectItem>
          <SelectItem value="eat">East Africa Time (EAT)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>LAW</SelectLabel>
          <SelectItem value="msk">Moscow Time (MSK)</SelectItem>
          <SelectItem value="ist">India Standard Time (IST)</SelectItem>
          <SelectItem value="cst_china">China Standard Time (CST)</SelectItem>
          <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
          <SelectItem value="kst">Korea Standard Time (KST)</SelectItem>
          <SelectItem value="ist_indonesia">
            Indonesia Central Standard Time (WITA)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
