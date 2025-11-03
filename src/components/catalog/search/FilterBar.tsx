"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, use, Suspense, ComponentProps } from "react";
import type { GroupedTerms, Subject } from "@/lib/types";
import { Option } from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { SPMultiselectGroups } from "./SPMultiselectGroups";
import { CollegeSelect } from "./CollegeSelect";
import { TermSelect } from "./TermSelect";
import { RangeSlider } from "./RangeSlider";

export function SearchPanel(props: {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
  campuses: Promise<{ name: string | null; group: string | null }[]>;
  classTypes: Promise<string[]>;
  nupaths: Promise<Option[]>;
}) {
  return (
    <div className="bg-neu1 h-full min-h-0 w-full space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t-1">
      <h3 className="text-neu7 text-xs font-bold">SCHOOL</h3>
      <Suspense fallback={<ToggleSkeleton />}>
        <CollegeSelect terms={props.terms} />
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
          <SPMultiselectGroups
            label="CAMPUSES"
            opts={props.campuses}
            spCode="camp"
            placeholder="Select campus"
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
          className="text-neu7 pb-3 text-xs font-bold"
        >
          COURSE ID RANGE
        </Label>
        <RangeSlider />
      </div>
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
        <Label className="text-neu7 text-xs font-[700]">{props.label}</Label>
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
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="end"
            >
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
                            "font-[700]",
                        )}
                      >
                        <div className="flex items-center gap-2 pl-2">
                          {opt.value !== opt.label && (
                            <div
                              className={cn(
                                selected.some((f) => f.value === opt.value)
                                  ? "text-neu8"
                                  : "text-neu6 font-[700]",
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
              {s.value !== s.label && (
                <span className="text-neu8 font-[700]">{s.value}</span>
              )}
              <span
                className={cn(s.value === s.label ? "text-neu8" : "text-neu7")}
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

function MultiselectSkeleton() {
  return <div className="bg-neu3 h-9 w-full animate-pulse rounded-lg"></div>;
}

function ToggleSkeleton() {
  return <div className="bg-neu3 h-10 w-full animate-pulse rounded-lg"></div>;
}
