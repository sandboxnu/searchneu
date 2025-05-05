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
import MultipleSelector, { Option } from "@/components/ui/multi-select";
import { Switch } from "../ui/switch";

export function SearchPanel(props: {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
  campuses: Promise<string[]>;
  classTypes: Promise<string[]>;
  nupaths: Promise<Option[]>;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      <SearchBar />

      <div className="hidden space-y-6 xl:block">
        <div className="">
          <h3 className="font-semibold">Semester</h3>
          <Suspense fallback={<MultiselectSkeleton />}>
            <TermSelect terms={props.terms} />
          </Suspense>
        </div>

        <div className="">
          <h3 className="font-semibold">Subjects</h3>
          <Suspense fallback={<MultiselectSkeleton />}>
            <SPMultiselect
              opts={props.subjects}
              spCode="subj"
              placeholder="Select subjects"
              transform={(opts) => opts as Option[]}
            />
          </Suspense>
        </div>

        <div className="">
          <h3 className="font-semibold">NUPaths</h3>
          <Suspense fallback={<MultiselectSkeleton />}>
            <SPMultiselect
              opts={props.nupaths}
              spCode="nupath"
              placeholder="Select NUPaths"
              transform={(opts) => opts as Option[]}
            />
          </Suspense>
        </div>

        <div className="">
          <h3 className="font-semibold">Campus</h3>
          <Suspense fallback={<MultiselectSkeleton />}>
            <SPMultiselect
              opts={props.campuses}
              spCode="camp"
              placeholder="Select campus"
              transform={(opts) => opts.map((c) => ({ value: c, label: c }))}
            />
          </Suspense>
        </div>

        <div className="">
          <h3 className="font-semibold">ClassType</h3>
          <Suspense fallback={<MultiselectSkeleton />}>
            <SPMultiselect
              opts={props.classTypes}
              spCode="clty"
              placeholder="Select class type"
              transform={(opts) => opts.map((c) => ({ value: c, label: c }))}
            />
          </Suspense>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Honors</h3>
          <HonorsSwitch />
        </div>
      </div>
    </div>
  );
}

function SearchBar() {
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

  return (
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
  );
}

function TermSelect(props: { terms: Promise<GroupedTerms> }) {
  const terms = use(props.terms);

  const { term } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <Select
      onValueChange={(e) =>
        router.push(`/catalog/${e}?${searchParams.toString()}`)
      }
      value={term?.toString()}
    >
      <SelectTrigger className="bg-neu2 rounded-full md:w-40 xl:w-full">
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

// generally these very abstracted functions are bad, but in this case
// the four multiselects are nearly the same so some abstraction saves
// LoC

// SPMultiselect is a multiselect component that stores the state in the
// search params
function SPMultiselect<T>(props: {
  opts: Promise<T[]>;
  spCode: string;
  placeholder: string;
  transform: (opts: T[]) => Option[];
}) {
  const resolved = use(props.opts);
  const options = props.transform(resolved);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateSearchParams(opts: Option[]) {
    const params = new URLSearchParams(searchParams);
    if (opts.length === 0) {
      params.delete(props.spCode);
      // router.push(`${pathname}?${params.toString()}`);

      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
      return;
    }

    params.delete(props.spCode);
    opts.forEach((s) => params.append(props.spCode, s.value));
    // router.push(`${pathname}?${params.toString()}`);
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  const spSelected = searchParams.getAll(props.spCode);
  const selected = options.filter((s) => spSelected.indexOf(s.value) > -1);

  return (
    <MultipleSelector
      value={selected as Option[]}
      onChange={updateSearchParams}
      defaultOptions={options as Option[]}
      placeholder={props.placeholder}
      hidePlaceholderWhenSelected
      className="bg-neu2 rounded-full md:w-40 xl:w-full"
      emptyIndicator={
        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
          no results found
        </p>
      }
    />
  );
}

function HonorsSwitch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function updateSearchParams(state: boolean) {
    const params = new URLSearchParams(searchParams);
    if (!state) {
      params.delete("honors");
      router.push(`${pathname}?${params.toString()}`);
      return;
    }

    params.set("honors", "true");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Switch
      checked={Boolean(searchParams.get("honors"))}
      onCheckedChange={updateSearchParams}
    />
  );
}

function MultiselectSkeleton() {
  return <div className="bg-neu3 h-9 w-full animate-pulse rounded-full"></div>;
}
