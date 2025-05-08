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
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { useState, useEffect, use, Suspense, ComponentProps } from "react";
import type { GroupedTerms, Subject } from "@/lib/types";
import MultipleSelector, { Option } from "@/components/ui/multi-select";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";

export function SearchPanel(props: {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
  campuses: Promise<string[]>;
  classTypes: Promise<string[]>;
  nupaths: Promise<Option[]>;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-4">
      <SearchBar />

      <div className="hidden space-y-6 xl:block">
        <Suspense fallback={<ToggleSkeleton />}>
          <CollegeToggle terms={props.terms} />
        </Suspense>

        <div className="">
          <Label
            htmlFor="course-term-select"
            className="pb-2 text-base font-semibold"
          >
            Semester
          </Label>
          <Suspense fallback={<MultiselectSkeleton />}>
            <TermSelect terms={props.terms} id="course-term-select" />
          </Suspense>
        </div>

        <div className="">
          <Label
            htmlFor="course-subject-select"
            className="pb-2 text-base font-semibold"
          >
            Subjects
          </Label>
          <Suspense fallback={<MultiselectSkeleton />}>
            <SPMultiselect
              opts={props.subjects}
              commandProps={{ id: "course-subject-select" }}
              spCode="subj"
              placeholder="Select subjects"
              transform={(opts) => opts as Option[]}
            />
          </Suspense>
        </div>

        <div className="">
          <Label
            htmlFor="course-campus-select"
            className="pb-2 text-base font-semibold"
          >
            NUPaths
          </Label>
          <Suspense fallback={<MultiselectSkeleton />}>
            <SPMultiselect
              opts={props.nupaths}
              commandProps={{ id: "course-nupath-select" }}
              spCode="nupath"
              placeholder="Select NUPaths"
              transform={(opts) => opts as Option[]}
            />
          </Suspense>
        </div>

        <div className="">
          <Label
            htmlFor="course-campus-select"
            className="pb-2 text-base font-semibold"
          >
            Campus
          </Label>
          <Suspense fallback={<MultiselectSkeleton />}>
            <SPMultiselect
              opts={props.campuses}
              commandProps={{ id: "course-campus-select" }}
              spCode="camp"
              placeholder="Select campus"
              transform={(opts) => opts.map((c) => ({ value: c, label: c }))}
            />
          </Suspense>
        </div>

        <div className="">
          <Label
            htmlFor="course-classtype-select"
            className="pb-2 text-base font-semibold"
          >
            Class Type
          </Label>
          <Suspense fallback={<MultiselectSkeleton />}>
            <SPMultiselect
              opts={props.classTypes}
              commandProps={{ id: "course-classtype-select" }}
              spCode="clty"
              placeholder="Select class type"
              transform={(opts) => opts.map((c) => ({ value: c, label: c }))}
            />
          </Suspense>
        </div>

        <div className="flex items-center justify-between">
          <Label
            htmlFor="course-honors-toggle"
            className="pb-3 text-base font-semibold"
          >
            Honors
          </Label>
          <HonorsSwitch id="course-honors-toggle" />
        </div>

        <div className="">
          <Label
            htmlFor="course-id-range"
            className="pb-3 text-base font-semibold"
          >
            Course Id
          </Label>
          <RangeSlider />
          <div className="text-neu6 flex w-full justify-between pt-2 text-sm">
            <p>1k</p>
            <p>2k</p>
            <p>3k</p>
            <p>4k</p>
            <p>5k</p>
            <p>6k</p>
            <p>7k</p>
            <p>8k</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { course } = useParams();
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
    }, 300);

    if (!course) {
      if (!query.trim()) {
        document.title = `SearchNEU`;
      } else {
        document.title = `${query} | SearchNEU`;
      }
    }

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
        className="bg-background rounded-l-lg rounded-r-none border-[0.5px] border-r-0"
        placeholder="Search for a course, CRN, or phrase"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />
      <Button
        size="icon"
        className="rounded-l-none rounded-r-lg"
        onClick={() => handleSubmit()}
      >
        🔍
      </Button>
    </div>
  );
}

function CollegeToggle(props: { terms: Promise<GroupedTerms> }) {
  const terms = use(props.terms);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { term } = useParams();

  const activeCollege = Object.keys(terms).find((k) =>
    terms[k as keyof GroupedTerms].find((t) => t.term === term?.toString()),
  );

  return (
    <ToggleGroup
      variant="default"
      type="single"
      size="sm"
      defaultValue={activeCollege}
      onValueChange={(val) => {
        const newestTerm = terms[val as keyof GroupedTerms][0];
        router.push(`/catalog/${newestTerm.term}?${searchParams.toString()}`);
      }}
      className="bg-neu2 w-full gap-2 rounded-lg p-1 *:data-[slot=toggle-group-item]:rounded-md *:data-[slot=toggle-group-item]:px-3"
    >
      <ToggleGroupItem value="neu" aria-label="Toggle last 24 hours">
        NEU
      </ToggleGroupItem>
      <ToggleGroupItem value="cps" aria-label="Toggle last 7 days">
        CPS
      </ToggleGroupItem>
      <ToggleGroupItem value="law" aria-label="Toggle last 7 days">
        LAW
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function TermSelect(
  props: { terms: Promise<GroupedTerms> } & ComponentProps<
    typeof SelectTrigger
  >,
) {
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
      <SelectTrigger
        className="bg-neu2 rounded-full md:w-40 xl:w-full"
        {...props}
      >
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
function SPMultiselect<T>(
  props: {
    opts: Promise<T[]>;
    spCode: string;
    transform: (opts: T[]) => Option[];
  } & ComponentProps<typeof MultipleSelector>,
) {
  const resolved = use(props.opts);
  const options = props.transform(resolved);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateSearchParams(opts: Option[]) {
    const params = new URLSearchParams(searchParams);
    if (opts.length === 0) {
      params.delete(props.spCode);

      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
      return;
    }

    params.delete(props.spCode);
    opts.forEach((s) => params.append(props.spCode, s.value));
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  const spSelected = searchParams.getAll(props.spCode);
  const selected = options.filter((s) => spSelected.indexOf(s.value) > -1);

  return (
    <MultipleSelector
      value={selected as Option[]}
      onChange={updateSearchParams}
      defaultOptions={options as Option[]}
      hidePlaceholderWhenSelected
      className="bg-neu2 rounded-full md:w-40 xl:w-full"
      emptyIndicator={
        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
          no results found
        </p>
      }
      {...props}
    />
  );
}

function HonorsSwitch(props: ComponentProps<typeof Switch>) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function updateSearchParams(state: boolean) {
    const params = new URLSearchParams(searchParams);
    if (!state) {
      params.delete("honors");
      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
      return;
    }

    params.set("honors", "true");
    window.history.pushState(null, "", `${pathname}?${params.toString()}`);
  }

  return (
    <Switch
      checked={Boolean(searchParams.get("honors"))}
      onCheckedChange={updateSearchParams}
      {...props}
    />
  );
}

function RangeSlider() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [d, setD] = useState([
    Number.parseInt(searchParams.get("nci") ?? "1"),
    Number.parseInt(searchParams.get("xci") ?? "8"),
  ]);

  // debounce the range slider (avoid request every notch)
  useEffect(() => {
    function updateSearchParams(range: number[]) {
      const params = new URLSearchParams(searchParams);
      if (range[0] === 1 && range[1] === 8) {
        params.delete("nci");
        params.delete("xci");
        window.history.pushState(null, "", `${pathname}?${params.toString()}`);
        return;
      }

      params.set("nci", String(range[0]));
      params.set("xci", String(range[1]));
      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
    }

    const timeoutId = setTimeout(() => {
      updateSearchParams(d);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [d]);

  return (
    <Slider
      id="course-id-range"
      value={d}
      onValueChange={setD}
      min={1}
      max={8}
      step={1}
    />
  );
}

function MultiselectSkeleton() {
  return <div className="bg-neu3 h-9 w-full animate-pulse rounded-full"></div>;
}

function ToggleSkeleton() {
  return <div className="bg-neu3 h-10 w-full animate-pulse rounded-lg"></div>;
}
