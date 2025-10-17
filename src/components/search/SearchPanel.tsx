"use client";

import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { useState, useEffect, use, Suspense, ComponentProps } from "react";
import type { GroupedTerms, Subject } from "@/lib/types";
import { Option } from "@/components/ui/multi-select";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function SearchPanel(props: {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
  campuses: Promise<string[]>;
  classTypes: Promise<string[]>;
  nupaths: Promise<Option[]>;
}) {
  return (
    <div className="bg-background h-[calc(100vh-72px)] w-full space-y-4 overflow-y-scroll rounded-lg border-1 px-4 py-4">
      <h3 className="text-neu7 text-xs font-bold">SCHOOL</h3>
      <Suspense fallback={<ToggleSkeleton />}>
        <CollegeToggle terms={props.terms} />
      </Suspense>

      <div className="">
        <Label
          htmlFor="course-term-select"
          className="text-neu7 text-xs font-bold"
        >
          SEMESTER
        </Label>
        <Suspense fallback={<MultiselectSkeleton />}>
          <TermSelect terms={props.terms} id="course-term-select" />
        </Suspense>
      </div>

      <div className="">
        <Suspense fallback={<MultiselectSkeleton />}>
          <SPMultiselect
            label="CAMPUSES"
            opts={props.campuses}
            spCode="camp"
            placeholder="Select campus"
            transform={(opts) => opts.map((c) => ({ value: c, label: c }))}
          />
        </Suspense>
      </div>

      <Separator />

      <div className="">
        <Suspense fallback={<MultiselectSkeleton />}>
          <SPMultiselect
            label="SUBJECTS"
            opts={props.subjects}
            spCode="subj"
            placeholder="Select subjects"
            transform={(opts) => opts as Option[]}
          />
        </Suspense>
      </div>

      <div className="">
        <Suspense fallback={<MultiselectSkeleton />}>
          <SPMultiselect
            label="NUPATHS"
            opts={props.nupaths}
            spCode="nupath"
            placeholder="Select NUPaths"
            transform={(opts) => opts as Option[]}
          />
        </Suspense>
      </div>

      <div className="flex items-center justify-between">
        <Label
          htmlFor="course-honors-toggle"
          className="text-neu7 text-xs font-bold"
        >
          HONORS
        </Label>
        <HonorsSwitch id="course-honors-toggle" />
      </div>

      <Separator />

      <div className="">
        <Suspense fallback={<MultiselectSkeleton />}>
          <SPMultiselect
            label="CLASS TYPE"
            opts={props.classTypes}
            spCode="clty"
            placeholder="Select class type"
            transform={(opts) => opts.map((c) => ({ value: c, label: c }))}
          />
        </Suspense>
      </div>

      <div className="">
        <Label
          htmlFor="course-id-range"
          className="text-neu7 pb-3 text-sm font-bold"
        >
          COURSE ID RANGE
        </Label>
        <RangeSlider />
        <div className="text-neu6 flex w-full justify-between pt-2 text-sm">
          <RangeTicks />
        </div>
        <div className="text-neu6 flex w-full justify-between text-sm">
          <RangeLabels />
        </div>
      </div>
    </div>
  );
}

// Replace the existing CollegeToggle function with this:
function CollegeToggle(props: { terms: Promise<GroupedTerms> }) {
  const terms = use(props.terms);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { term } = useParams();

  const activeCollege =
    Object.keys(terms).find((k) =>
      terms[k as keyof GroupedTerms].find((t) => t.term === term?.toString()),
    ) ?? "neu";

  // HACK: this will blink but for now its fine
  if (typeof window !== "undefined")
    document.body.setAttribute("data-theme", activeCollege);

  const collegeOptions = [
    { value: "neu", label: "Northeastern University" },
    { value: "cps", label: "College of Professional Studies" },
    { value: "law", label: "School of Law" },
  ];

  return (
    <div className="space-y-2">
      <Select
        onValueChange={(val) => {
          if (val === "") return;
          const newestTerm = terms[val as keyof GroupedTerms][0];
          document.body.setAttribute("data-theme", val);
          router.push(`/catalog/${newestTerm.term}?${searchParams.toString()}`);
        }}
        value={activeCollege}
      >
        <SelectTrigger
          className={`bg-secondary h-[40px] w-full ${
            activeCollege === "neu"
              ? "bg-[#FAD7DA33] text-[#E63946]"
              : activeCollege === "cps"
                ? "bg-[#FFECD233] text-[#FF9F1C]"
                : "bg-[#DAE5EB4D] text-[#457B9D]"
          }`}
        >
          <SelectValue placeholder="Select school" />
        </SelectTrigger>
        <SelectContent>
          {collegeOptions.map((college) => (
            <SelectItem
              key={college.value}
              value={college.value}
              className={`text-[14px] font-[600] ${
                college.value === "neu"
                  ? "text-[#E63946]"
                  : college.value === "cps"
                    ? "text-[#FF9F1C]"
                    : "text-[#457B9D]"
              } ${
                activeCollege === "neu" && college.value === "neu"
                  ? "bg-[#FAD7DA33]"
                  : activeCollege === "cps" && college.value === "cps"
                    ? "bg-[#FFECD233]"
                    : activeCollege === "law" && college.value === "law"
                      ? "bg-[#DAE5EB4D]"
                      : ""
              }`}
            >
              {college.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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

  const activeCollege =
    Object.keys(terms).find((k) =>
      terms[k as keyof GroupedTerms].find((t) => t.term === term?.toString()),
    ) ?? "neu";

  return (
    <div className="text-neu8 space-y-2 pt-3 font-bold">
      <Select
        onValueChange={(e) =>
          router.push(`/catalog/${e}?${searchParams.toString()}`)
        }
        value={term?.toString()}
      >
        <SelectTrigger className="bg-secondary w-full" {...props}>
          <SelectValue placeholder="Select term" />
        </SelectTrigger>
        <SelectContent className="">
          {terms[activeCollege as keyof GroupedTerms].map((t) => (
            <SelectItem
              key={t.term}
              value={t.term}
              className={cn(
                t.term === term?.toString()
                  ? "text-neu8 font-bold"
                  : "text-neu6",
              )}
            >
              {t.name.replace(" Semester", "")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// generally these very abstracted functions are bad, but in this case
// the four multiselects are nearly the same so some abstraction saves
// LoC

// SPMultiselect is a multiselect component that stores the state in the
// search params
function SPMultiselect<T>(props: {
  id?: string;
  opts: Promise<T[]>;
  spCode: string;
  transform: (opts: T[]) => Option[];
  placeholder: string;
  label: string;
}) {
  const resolved = use(props.opts);
  const options = props
    .transform(resolved)
    // put in alphabetical order
    .sort((a, b) => a.label.localeCompare(b.label));

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

  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <Label className="text-neu7 text-xs font-bold">{props.label}</Label>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <p
              className="text-blue hover:text-blue/80 cursor-pointer text-xs"
              onClick={() => updateSearchParams([])}
            >
              Clear all
            </p>
          )}

          <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
              <PlusIcon
                className={cn(
                  "text-muted-foreground size-4",
                  open && "rotate-45",
                )}
              />
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
              <Command
                filter={(value, search, keywords) => {
                  const v = value.toLowerCase();
                  const s = search.toLowerCase();
                  const label = keywords?.join(" ").toLowerCase();
                  if (v === s) return 1;
                  if (v.includes(s)) return 0.8;
                  if (label?.includes(s)) return 0.7;
                  return 0;
                }}
              >
                <CommandInput placeholder="Search options..." />
                <CommandList>
                  <CommandEmpty>No results found</CommandEmpty>
                  <CommandGroup>
                    {options.map((opt) => (
                      <CommandItem
                        key={opt.value}
                        value={opt.value}
                        keywords={[opt.label]}
                        onSelect={(currentValue) => {
                          updateSearchParams(
                            selected.some((f) => f.value === currentValue)
                              ? selected.filter((f) => f.value !== currentValue)
                              : [...selected, opt],
                          );
                        }}
                        className={cn(
                          selected.some((f) => f.value === opt.value) &&
                            "font-bold",
                        )}
                      >
                        <div className="flex items-center gap-2 pl-2">
                          {opt.value !== opt.label && (
                            <div
                              className={cn(
                                selected.some((f) => f.value === opt.value)
                                  ? "text-neu8"
                                  : "text-neu6 font-bold",
                              )}
                            >
                              {opt.value}
                            </div>
                          )}
                          <div
                            className={cn(
                              selected.some((f) => f.value === opt.value)
                                ? "text-neu7"
                                : "text-neu6",
                            )}
                          >
                            {opt.label}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="block space-y-2 space-x-2 pt-3">
        {selected.slice(0, 3).map((s, i) => (
          <span
            key={i}
            className="bg-secondary inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-sm"
          >
            <span className="flex items-center gap-2">
              {s.value !== s.label && <span className="text-neu8 font-bold">{s.value}</span>}
              <span className={cn(
                              s.value === s.label
                                ? "text-neu8"
                                : "text-neu7"
                              )}
              >
                {s.label}
              </span>
            </span>
            <button
              onClick={() =>
                updateSearchParams(selected.filter((f) => f.value !== s.value))
              }
              aria-label={`Remove ${s.label}`}
              className="text-neu6 hover:text-neu7 ml-2 rounded-full py-0.5 text-lg leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {selected.length > 3 && (
          <span className="rounded-full border px-3 py-1">
            +{selected.length - 3}
          </span>
        )}
      </div>
    </>
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
      className="data-[state=checked]:bg-accent"
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
    Number.parseInt(searchParams.get("xci") ?? "9"),
  ]);

  // debounce the range slider (avoid request every notch)
  useEffect(() => {
    function updateSearchParams(range: number[]) {
      const params = new URLSearchParams(searchParams);
      if (range[0] === 1 && range[1] === 9) {
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
      className="**:data-[slot=slider-thumb]:bg-accent **:data-[slot=slider-range]:bg-accent"
      id="course-id-range"
      value={d}
      onValueChange={setD}
      min={1}
      max={9}
      step={1}
    />
  );
}

function RangeTicks() {
  function GenerateTicks(n: number) {
    return (
      <div key={n * 1000} className="flex w-[2px] flex-col items-center">
        <span
          className={cn(
            "text-muted-foreground border-l",
            n % 2 === 0 ? "h-3 border-current" : "h-2 border-current",
          )}
        />
      </div>
    );
  }

  return (
    <div className="mx-[5px] flex w-full justify-between">
      {Array.from({ length: 9 }, (_, i) => i + 1).map(GenerateTicks)}
    </div>
  );
}

function RangeLabels() {
  function GenerateLabels(n: number) {
    return (
      <div key={n * 1000} className="flex w-[2px] flex-col items-center">
        {n % 2 === 0 ? (
          <span className="text-muted-foreground text-sm">{n * 1000}</span>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    );
  }

  return (
    <div className="mx-[5px] flex w-full justify-between px-0">
      {Array.from({ length: 9 }, (_, i) => i + 1).map(GenerateLabels)}
    </div>
  );
}

function MultiselectSkeleton() {
  return <div className="bg-neu3 h-9 w-full animate-pulse rounded-lg"></div>;
}

function ToggleSkeleton() {
  return <div className="bg-neu3 h-10 w-full animate-pulse rounded-lg"></div>;
}
