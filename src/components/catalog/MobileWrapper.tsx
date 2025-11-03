"use client";

import { SearchPanel } from "./search/FilterBar";
import { GroupedTerms, Subject } from "@/lib/types";
import { useParams } from "next/navigation";
import { Option } from "../ui/multi-select";
import dynamic from "next/dynamic";
import { SearchBar } from "./search/SearchBar";
import { type ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { ListFilter } from "lucide-react";
import { Button } from "../ui/button";

// BUG: ssr on the results list w/ query params causes hydration error
// https://nextjs.org/docs/messages/react-hydration-error
const SearchResults = dynamic(() => import("./search/SearchResults"), {
  ssr: false,
});

export function MobileWrapper(props: {
  terms: Promise<GroupedTerms>;
  subjects: Promise<Subject[]>;
  campuses: Promise<{ name: string | null; group: string | null }[]>;
  classTypes: Promise<string[]>;
  nupaths: Promise<Option[]>;
  coursePage: ReactNode;
}) {
  const { course } = useParams();

  return (
    <div className="bg-neu2 flex min-h-0 w-screen min-w-0 flex-1 px-4 pt-4 xl:px-6">
      <div
        data-show={Boolean(course)}
        className="hidden h-full min-h-0 w-full max-w-[260px] md:block md:data-[show=true]:hidden xl:block!"
      >
        <SearchPanel {...props} />
      </div>
      <div
        data-show={Boolean(course)}
        className="flex min-h-0 w-full min-w-0 flex-col gap-4 md:data-[show=false]:pl-6 md:data-[show=true]:pl-0 xl:pl-6!"
      >
        <div data-show={Boolean(course)} className="flex items-center gap-2">
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-neu1 rounded-full md:hidden"
              >
                <ListFilter className="text-neu6 size-4" strokeWidth={2} />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[95vh]">
              <DrawerTitle className="text-center">Catalog Filters</DrawerTitle>
              <div className="overflow-y-scroll">
                <SearchPanel {...props} />
                <DrawerTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="bg-neu1 rounded-full md:hidden"
                  >
                    <ListFilter className="text-neu6 size-4" strokeWidth={2} />
                  </Button>
                </DrawerTrigger>
              </div>
            </DrawerContent>
          </Drawer>

          <SearchBar />
        </div>
        <div className="flex h-full min-h-0 w-full min-w-0">
          <div
            data-show={Boolean(course)}
            className="w-full data-[show=false]:block data-[show=true]:hidden xl:block! xl:max-w-[320px] xl:min-w-[300px]"
          >
            <SearchResults />
          </div>
          <div
            data-show={Boolean(course)}
            className="hidden min-w-0 flex-1 data-[show=true]:block xl:block"
          >
            {props.coursePage}
          </div>
        </div>
      </div>
    </div>
  );
}
