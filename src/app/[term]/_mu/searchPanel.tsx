"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, use, Suspense } from "react";
import type { GroupedTerms, Subject } from "@/lib/types";

export function SearchBar(props: {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [query, setQuery] = useState(searchParams.get("q")?.toString() ?? "");

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams(searchParams);
      if (!query.trim()) {
        params.delete("q");
        window.history.replaceState(
          null,
          "",
          `${pathname}?${params.toString()}`,
        );
        return;
      }

      params.set("q", query);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    };

    const timeoutId = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [query]);

  function handleSubmit() {
    const params = new URLSearchParams(searchParams);
    if (!query.trim()) {
      params.delete("q");
      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
      return;
    }

    params.set("q", query);
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  function clearField(field: string) {
    const params = new URLSearchParams(searchParams);
    params.delete(field);
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2 px-2 py-2">
      <div className="flex w-full">
        <Input
          className="bg-background rounded-r-none border-[0.5px] border-r-0"
          placeholder="Search for a course, CRN, or phrase"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <Button
          size="icon"
          className="rounded-l-none shadow-sm"
          onClick={() => handleSubmit()}
        >
          🔍
        </Button>
      </div>

      <div className="hidden xl:block">
        <div className="">
          <h3 className="font-semibold">Semester</h3>
          <Suspense fallback={<p>loading...</p>}>
            <TermSelect terms={props.terms} />
          </Suspense>
        </div>

        <div className="">
          <h3 className="font-semibold">Subjects</h3>
          <Suspense fallback={<p>loading...</p>}>
            <SubjectSelect subjects={props.subjects} />
          </Suspense>
          {searchParams.get("subject") && (
            <p
              onClick={() => clearField("subject")}
              className="cursor-pointer text-sm italic"
            >
              clear
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SubjectSelect(props: { subjects: Promise<Subject[]> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjects = use(props.subjects);
  const pathname = usePathname();

  function onChange(subj: string) {
    const params = new URLSearchParams(searchParams);
    if (!subj.trim()) {
      params.delete("subject");
      router.push(`${pathname}?${params.toString()}`);
      return;
    }

    params.set("subject", subj);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select onValueChange={onChange} value={searchParams.get("subject") ?? ""}>
      <SelectTrigger className="bg-background border-[0.5px] md:w-40 xl:w-52">
        <SelectValue placeholder="Select a subject" />
      </SelectTrigger>
      <SelectContent className="">
        {subjects.map((s) => (
          <SelectItem key={s.code} value={s.code}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TermSelect(props: { terms: Promise<GroupedTerms> }) {
  const { term } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const terms = use(props.terms);

  return (
    <Select
      onValueChange={(e) => router.push(`/${e}?${searchParams.toString()}`)}
      value={term?.toString()}
    >
      <SelectTrigger className="bg-background border-[0.5px] md:w-40 xl:w-52">
        <SelectValue placeholder="Select term" />
      </SelectTrigger>
      <SelectContent className="">
        <SelectGroup>
          <SelectLabel>NEU</SelectLabel>
          {terms.neu.map((t) => (
            <SelectItem key={t.term} value={t.term}>
              {t.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>CPS</SelectLabel>
          {terms.cps.map((t) => (
            <SelectItem key={t.term} value={t.term}>
              {t.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>LAW</SelectLabel>
          {terms.law.map((t) => (
            <SelectItem key={t.term} value={t.term}>
              {t.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
