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
      <h3 className="text-muted-foreground text-xs font-bold">SCHOOL</h3>
      <Suspense fallback={<ToggleSkeleton />}>
        <CollegeToggle terms={props.terms} />
      </Suspense>

      <div className="">
        <Label
          htmlFor="course-term-select"
          className="text-muted-foreground text-xs font-bold"
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
          className="text-muted-foreground text-xs font-bold"
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

      <div>
        <Label
          htmlFor="course-id-range"
          className="text-neutral-700 pb-2 text-sm font-medium"
        >
          Course Id
        </Label>
        <RangeSlider />
        <div className="text-neutral-600 flex w-full justify-between pt-2 text-sm">
          <p>1k</p>
          <p>2k</p>
          <p>3k</p>
          <p>4k</p>
          <p>5k</p>
          <p>6k</p>
          <p>7k</p>
          <p>8k</p>
          <p>9k</p>
        </div>
      </div>
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

  // Update theme attribute when college changes
  if (typeof window !== "undefined")
    document.body.setAttribute("data-theme", activeCollege ?? "neu");

  return (
    <ToggleGroup
      variant="default"
      type="single"
      size="sm"
      defaultValue={activeCollege}
      onValueChange={(val) => {
        if (val === "") {
          return;
        }
        const newestTerm = terms[val as keyof GroupedTerms][0];
        document.body.setAttribute("data-theme", val);
        router.push(`/catalog/${newestTerm.term}?${searchParams.toString()}`);
      }}
      className="bg-secondary w-full gap-2 rounded-lg p-1 *:data-[slot=toggle-group-item]:rounded-md *:data-[slot=toggle-group-item]:px-3 *:data-[slot=toggle-group-item]:font-bold"
    >
      <ToggleGroupItem
        value="neu"
        aria-label="Toggle NEU college"
        className="data-[state=on]:text-brand-neu"
      >
        NEU
      </ToggleGroupItem>
      <ToggleGroupItem
        value="cps"
        aria-label="Toggle CPS college"
        className="data-[state=on]:text-brand-cps"
      >
        CPS
      </ToggleGroupItem>
      <ToggleGroupItem
        value="law"
        aria-label="Toggle LAW college"
        className="data-[state=on]:text-brand-law"
      >
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

  const activeCollege =
    Object.keys(terms).find((k) =>
      terms[k as keyof GroupedTerms].find((t) => t.term === term?.toString()),
    ) ?? "neu";

  return (
    <div className="space-y-2 pt-3">
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
            <SelectItem key={t.term} value={t.term}>
              {t.name}
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
        <Label className="text-muted-foreground text-xs font-bold">
          {props.label}
        </Label>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <p
              className="text-status-info hover:text-status-info/80 cursor-pointer text-xs"
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
                      >
                        <div className="data-[selected=true]:bg-foreground data-[selected=true]:text-background data-[selected=true]:border-foreground pointer-events-none size-4 shrink-0 rounded-[4px] border transition-all select-none *:[svg]:opacity-0 data-[selected=true]:*:[svg]:opacity-100"
                          data-selected={selected.some(
                            (f) => f.value === opt.value,
                          )}
                        >
                          <CheckIcon className="size-3.5 text-current" />
                        </div>
                        {opt.label}
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
            {s.label}
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

function MultiselectSkeleton() {
  return <div className="bg-primary h-9 w-full animate-pulse rounded-lg" />;
}

function ToggleSkeleton() {
  return <div className="bg-primary h-10 w-full animate-pulse rounded-lg" />;
}
