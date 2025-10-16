"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, use, useState } from "react";
import type { GroupedTerms } from "@/lib/types";

export function HomeSearch(props: { terms: Promise<GroupedTerms> }) {
  const terms = use(props.terms);
  const termState = useState(terms.neu[0].term);
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit() {
    const params = new URLSearchParams();
    params.set("q", query);
    router.push(`/catalog/${termState[0]}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2 rounded px-8 pt-8 pb-4 shadow-md">
      <div className="flex flex-col-reverse gap-1 md:flex-row md:gap-0">
        <TermSelect terms={terms} handler={termState} />
        <div className="flex w-full">
          <Input
            className="bg-neu1 h-10 rounded-r-none border-0 border-l-[0.5px] md:rounded-none"
            placeholder="Search by course, professor, or phrase..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <Button
            size="icon"
            className="size-10 rounded-l-none shadow-sm"
            onClick={() => handleSubmit()}
          >
            <Search className="size-4" transform="scale(-1, 1)" />
          </Button>
        </div>
      </div>
      <Link href={`/catalog/${termState[0]}`} className="italic">
        See all courses
      </Link>
    </div>
  );
}

function TermSelect(props: {
  terms: GroupedTerms;
  handler: [string, Dispatch<SetStateAction<string>>];
}) {
  return (
    <Select value={props.handler[0]} onValueChange={(v) => props.handler[1](v)}>
      <SelectTrigger className="bg-neu1 ring-0 data-[size=default]:h-10 md:w-40 md:rounded-r-none md:border-none xl:w-52">
        <SelectValue placeholder="Select term" />
      </SelectTrigger>
      <SelectContent className="">
        <SelectGroup>
          <SelectLabel>NEU</SelectLabel>
          {props.terms.neu.map((t) => (
            <SelectItem key={t.term} value={t.term}>
              {t.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>CPS</SelectLabel>
          {props.terms.cps.map((t) => (
            <SelectItem key={t.term} value={t.term}>
              {t.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>LAW</SelectLabel>
          {props.terms.law.map((t) => (
            <SelectItem key={t.term} value={t.term}>
              {t.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
