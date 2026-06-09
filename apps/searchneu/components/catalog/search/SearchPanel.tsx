"use client";

import { Separator } from "@/components/ui/separator";
import { CollegeSelect } from "./CollegeSelect";
import { TermSelect } from "./TermSelect";
import { RangeSlider } from "./RangeSlider";
import {
  CampusSelect,
  ClassTypeSelect,
  HonorsSwitch,
  NupathSelect,
  SubjectSelect,
  type CatalogFilterData,
} from "./filters";

export type { CatalogFilterData };

// SearchPanel is just the manifest of which filters appear, in what order, and
// where the dividers go. Each filter is self-contained (label, control,
// loading state, and URL wiring all live with the filter), so adding,
// removing, or reordering a filter is a one-line change here.
export function SearchPanel(props: CatalogFilterData) {
  return (
    <div className="bg-neu0 h-full min-h-0 w-full space-y-6 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t">
      <CollegeSelect terms={props.terms} />
      <TermSelect terms={props.terms} />
      <CampusSelect campuses={props.campuses} />

      <Separator className="my-6" />

      <SubjectSelect subjects={props.subjects} />
      <NupathSelect nupaths={props.nupaths} />
      <HonorsSwitch />

      <Separator className="my-6" />

      <ClassTypeSelect classTypes={props.classTypes} />
      <RangeSlider />

      <div className="pb-20 md:hidden" />
    </div>
  );
}
