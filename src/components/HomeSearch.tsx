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

interface HomeSearchProps {
  terms: Promise<GroupedTerms>;
}

/**
 * HomeSearch Component
 * Search interface for the home page with term selection and query input
 */
export function HomeSearch(props: HomeSearchProps) {
  const terms = use(props.terms);
  const termState = useState(terms.neu[0].term);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    const params = new URLSearchParams();
    params.set("q", query);
    router.push(`/catalog/${termState[0]}?${params.toString()}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded px-8 pt-8 pb-4 shadow-md">
      <div className="flex flex-col-reverse gap-1 md:flex-row md:gap-0">
        <TermSelect terms={terms} handler={termState} />
        <div className="flex w-full">
          <Input
            className="bg-background h-10 rounded-r-none border-0 border-l-[0.5px] md:rounded-none"
            placeholder="Search by course, professor, or phrase..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            size="icon"
            className="size-10 rounded-l-none shadow-sm"
            onClick={handleSubmit}
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

interface TermSelectProps {
  terms: GroupedTerms;
  handler: [string, Dispatch<SetStateAction<string>>];
}

/**
 * TermSelect Component
 * Dropdown for selecting academic term grouped by school/college
 */
function TermSelect(props: TermSelectProps) {
  const { terms, handler } = props;
  const [selectedTerm, setSelectedTerm] = handler;

  return (
    <Select value={selectedTerm} onValueChange={setSelectedTerm}>
      <SelectTrigger className="bg-background ring-0 data-[size=default]:h-10 md:w-40 md:rounded-r-none md:border-none xl:w-52">
        <SelectValue placeholder="Select term" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>NEU</SelectLabel>
          {terms.neu.map((term) => (
            <SelectItem key={term.term} value={term.term}>
              {term.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>CPS</SelectLabel>
          {terms.cps.map((term) => (
            <SelectItem key={term.term} value={term.term}>
              {term.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>LAW</SelectLabel>
          {terms.law.map((term) => (
            <SelectItem key={term.term} value={term.term}>
              {term.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
