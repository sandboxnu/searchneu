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
      <div className="h-full grid-cols-12 md:grid!">
        <div className="bg-neu1 col-span-12 px-2 py-2 xl:pr-0 xl:pl-4">
          <SearchBar />
        </div>
        <div className="bg-neu1 hidden w-full px-2 md:col-span-5 md:flex lg:col-span-3 xl:col-span-5 xl:px-4">
          <SearchPanel {...props} />
        </div>
        <div className="col-span-12 pr-2 md:col-span-7 lg:col-span-9 xl:col-span-7 xl:px-0">
          <SearchResults />
        </div>
      </div>
    </div>
  );
}
