"use client";

import { SearchPanel } from "./SearchPanel";
import { GroupedTerms, Subject } from "@/lib/types";
import { useParams } from "next/navigation";
import { Option } from "../ui/multi-select";
import dynamic from "next/dynamic";
import { SearchBar } from "./SearchBar";
import { type ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { FilterIcon, ListFilter } from "lucide-react";
import { Button } from "../ui/button";

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
  coursePage: ReactNode;
}) {
  const { course } = useParams();

  return (
    <div className="grid h-full w-full grid-cols-6">
      <div
        data-show={Boolean(course)}
        className="col-span-2 hidden w-full md:block md:data-[show=true]:hidden xl:col-span-1 xl:block!"
      >
        <SearchPanel {...props} />
      </div>
      <div
        data-show={Boolean(course)}
        className="col-span-6 flex flex-col gap-4 md:col-span-4 md:data-[show=false]:pl-6 md:data-[show=true]:col-span-6 md:data-[show=true]:pl-0 xl:col-span-5! xl:pl-6!"
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
              </div>
            </DrawerContent>
          </Drawer>

          <SearchBar />
        </div>
        <div className="grid grid-cols-4">
          <div
            data-show={Boolean(course)}
            className="col-span-4 data-[show=false]:block data-[show=true]:hidden xl:col-span-1 xl:block!"
          >
            <SearchResults />
          </div>
          <div
            className="col-span-4 hidden data-[show=true]:block xl:col-span-3 xl:block"
            data-show={Boolean(course)}
          >
            {props.coursePage}
          </div>
        </div>
      </div>
    </div>
  );
}
