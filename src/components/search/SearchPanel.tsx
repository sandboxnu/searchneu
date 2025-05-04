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

const OPTIONS: Option[] = [
  { label: "nextjs", value: "nextjs" },
  { label: "React", value: "react" },
  { label: "Remix", value: "remix" },
  { label: "Vite", value: "vite" },
  { label: "Nuxt", value: "nuxt" },
  { label: "Vue", value: "vue" },
  { label: "Svelte", value: "svelte" },
  { label: "Angular", value: "angular" },
  { label: "Ember", value: "ember", disable: true },
  { label: "Gatsby", value: "gatsby", disable: true },
  { label: "Astro", value: "astro", fixed: true },
];

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
    <div className="flex flex-col gap-2 px-4 py-2">
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

      <div className="hidden space-y-6 xl:block">
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

        <div className="">
          <h3 className="font-semibold">NUPaths</h3>
          <MultipleSelector
            defaultOptions={OPTIONS}
            className="bg-neu2 rounded-full md:w-40 xl:w-full"
            placeholder="Select frameworks you like..."
            emptyIndicator={
              <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                no results found.
              </p>
            }
          />
        </div>

        <div className="">
          <h3 className="font-semibold">Campus</h3>
          <MultipleSelector
            defaultOptions={OPTIONS}
            className="bg-neu2 rounded-full md:w-40 xl:w-full"
            placeholder="Select frameworks you like..."
            emptyIndicator={
              <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                no results found.
              </p>
            }
          />
        </div>

        <div className="">
          <h3 className="font-semibold">Class Type</h3>
          <MultipleSelector
            defaultOptions={OPTIONS}
            className="bg-neu2 rounded-full md:w-40 xl:w-full"
            placeholder="Select frameworks you like..."
            emptyIndicator={
              <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                no results found.
              </p>
            }
          />
        </div>

        <div className="">
          <h3 className="font-semibold">Class Type</h3>
          <MultipleSelector
            defaultOptions={OPTIONS}
            className="bg-neu2 rounded-full md:w-40 xl:w-full"
            placeholder="Select frameworks you like..."
            emptyIndicator={
              <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                no results found.
              </p>
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Honors</h3>
          <Switch />
        </div>
      </div>
    </div>
  );
}

function SubjectSelect(props: { subjects: Promise<Subject[]> }) {
  // const router = useRouter();
  // const searchParams = useSearchParams();
  const subjects = use(props.subjects);
  // const pathname = usePathname();

  // function onChange(subj: string) {
  //   const params = new URLSearchParams(searchParams);
  //   if (!subj.trim()) {
  //     params.delete("subject");
  //     router.push(`${pathname}?${params.toString()}`);
  //     return;
  //   }
  //
  //   params.set("subject", subj);
  //   router.push(`${pathname}?${params.toString()}`);
  // }

  return (
    <MultipleSelector
      defaultOptions={subjects as Option[]}
      placeholder="Select subjects"
      hidePlaceholderWhenSelected
      className="bg-neu2 rounded-full md:w-40 xl:w-full"
      emptyIndicator={
        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
          no results found.
        </p>
      }
    />
    //   <Select onValueChange={onChange} value={searchParams.get("subject") ?? ""}>
    //     <SelectTrigger className="bg-neu2 rounded-full md:w-40 xl:w-full">
    //       <SelectValue placeholder="Select a subject" />
    //     </SelectTrigger>
    //     <SelectContent className="">
    //       {subjects.map((s) => (
    //         <SelectItem key={s.code} value={s.code}>
    //           {s.name}
    //         </SelectItem>
    //       ))}
    //     </SelectContent>
    //   </Select>
    // );
  );
}

function TermSelect(props: { terms: Promise<GroupedTerms> }) {
  const { term } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const terms = use(props.terms);

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
