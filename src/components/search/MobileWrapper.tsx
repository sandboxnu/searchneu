"use client";

import { SearchResults } from "./SearchResults";
import { SearchBar } from "./SearchPanel";
import { GroupedTerms, Subject } from "@/lib/types";
import { useParams } from "next/navigation";

export function MobileWrapper(props: {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
}) {
  const { course } = useParams();

  return (
    <div
      data-show={!Boolean(course)}
      className="col-span-12 hidden data-[show=true]:block xl:col-span-5 xl:block!"
    >
      <div className="flex grid-cols-2 flex-col xl:grid!">
        <div className="col-span-1">
          <SearchBar terms={props.terms} subjects={props.subjects} />
        </div>
        <div className="col-span-1">
          <SearchResults />
        </div>
      </div>
    </div>
  );
}
