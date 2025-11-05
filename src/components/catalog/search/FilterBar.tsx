"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, ComponentProps } from "react";
import type { GroupedTerms, Subject } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SPMultiselectGroups } from "./SPMultiselectGroups";
import { CollegeSelect } from "./CollegeSelect";
import { TermSelect } from "./TermSelect";
import { RangeSlider } from "./RangeSlider";
import { SPMultiselect } from "./SPMultiselect";

interface Option {
  label: string;
  value: string;
}

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

      <div className="w-full">
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

      <div className="pb-20 md:hidden"></div>
    </div>
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
