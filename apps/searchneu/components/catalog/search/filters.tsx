"use client";

import { useSearchParams } from "next/navigation";
import type { GroupedTerms, Nupath, Subject } from "@/lib/catalog/types";
import { useSearchParamWriter } from "@/lib/catalog/useSearchParamWriter";
import { Switch } from "@/components/ui/switch";
import { FilterSection } from "./FilterSection";
import { SPMultiselect } from "./SPMultiselect";

/**
 * The shape of the data the catalog filters consume. Every promise is resolved
 * lazily by the individual filter that needs it (via `<Suspense>`), so the
 * panel can stream in.
 */
export interface CatalogFilterData {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
  campuses: Promise<{ name: string | null; group: string | null }[]>;
  classTypes: Promise<string[]>;
  nupaths: Promise<Nupath[]>;
}

// Each filter below binds the generic SPMultiselect to one domain: its search
// param code, label, placeholder, and the mapping from domain data to options.
// This keeps the panel free of transform/param-code boilerplate.

export function SubjectSelect(props: { subjects: CatalogFilterData["subjects"] }) {
  return (
    <SPMultiselect
      label="SUBJECTS"
      spCode="subj"
      placeholder="Select subjects"
      opts={props.subjects}
      transform={(opts) => opts.map((o) => ({ label: o.name, value: o.code }))}
    />
  );
}

export function NupathSelect(props: { nupaths: CatalogFilterData["nupaths"] }) {
  return (
    <SPMultiselect
      label="NUPATHS"
      spCode="nupath"
      placeholder="Select NUPaths"
      opts={props.nupaths}
      transform={(opts) => opts.map((o) => ({ label: o.name, value: o.short }))}
    />
  );
}

export function ClassTypeSelect(props: {
  classTypes: CatalogFilterData["classTypes"];
}) {
  return (
    <SPMultiselect
      label="CLASS TYPE"
      spCode="clty"
      placeholder="Select class type"
      opts={props.classTypes}
      transform={(opts) => opts.map((c) => ({ label: c, value: c }))}
    />
  );
}

export function CampusSelect(props: { campuses: CatalogFilterData["campuses"] }) {
  return (
    <SPMultiselect
      label="CAMPUSES"
      spCode="camp"
      placeholder="Select campus"
      opts={props.campuses}
      transform={(opts) =>
        opts.map((o) => ({
          label: o.name ?? "",
          value: o.name ?? "",
          group: o.group ?? "",
        }))
      }
    />
  );
}

export function HonorsSwitch() {
  const searchParams = useSearchParams();
  const { setValue } = useSearchParamWriter();

  return (
    <FilterSection
      label="HONORS"
      htmlFor="course-honors-toggle"
      action={
        <Switch
          id="course-honors-toggle"
          checked={Boolean(searchParams.get("honors"))}
          className="data-[state=checked]:bg-accent"
          onCheckedChange={(state) =>
            setValue("honors", state ? "true" : null)
          }
        />
      }
    />
  );
}
