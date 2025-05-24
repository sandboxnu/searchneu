"use client";

import { SearchPanel } from "./SearchPanel";
import { GroupedTerms, Subject } from "@/lib/types";
import { useParams } from "next/navigation";
import { Option } from "../ui/multi-select";
import dynamic from "next/dynamic";
import { SearchBar } from "./SearchBar";

// BUG: ssr on the results list w/ query params causes hydration error
// https://nextjs.org/docs/messages/react-hydration-error
const SearchResults = dynamic(() => import("./SearchResults"), {
  ssr: false,
});

export function MobileWrapper(props: {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
  campuses: Promise<string[]>;
  classTypes: Promise<string[]>;
  nupaths: Promise<Option[]>;
}) {
  const { course } = useParams();

  return (
    <div
      data-show={!Boolean(course)}
      className="col-span-12 hidden rounded-t-lg data-[show=true]:block xl:col-span-5 xl:block!"
    >
      <div className="flex grid-cols-12 flex-col xl:grid!">
        <div className="bg-neu1 col-span-12 py-2 pl-4">
          <SearchBar />
        </div>
        <div className="bg-neu1 col-span-5">
          <SearchPanel {...props} />
        </div>
        <div className="col-span-7">
          <SearchResults />
        </div>
      </div>
    </div>
  );
}
