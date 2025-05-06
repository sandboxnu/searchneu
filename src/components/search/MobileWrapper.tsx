"use client";

import { SearchResults } from "./SearchResults";
import { SearchPanel } from "./SearchPanel";
import { GroupedTerms, Subject } from "@/lib/types";
import { useParams } from "next/navigation";
import { Option } from "../ui/multi-select";

export function MobileWrapper(props: {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
  campuses: Promise<string[]>;
  classTypes: Promise<string[]>;
  nupaths: Promise<Option[]>;
  searchUrl: string;
}) {
  const { course } = useParams();

  return (
    <div
      data-show={!Boolean(course)}
      className="col-span-12 hidden data-[show=true]:block xl:col-span-5 xl:block!"
    >
      <div className="flex grid-cols-2 flex-col xl:grid!">
        <div className="col-span-1">
          <SearchPanel {...props} />
        </div>
        <div className="col-span-1">
          <SearchResults searchUrl={props.searchUrl} />
        </div>
      </div>
    </div>
  );
}
