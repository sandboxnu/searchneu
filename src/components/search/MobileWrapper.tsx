"use client";

import { SearchPanel } from "./SearchPanel";
import { GroupedTerms, Subject } from "@/lib/types";
import { useParams } from "next/navigation";
import { Option } from "../ui/multi-select";
import dynamic from "next/dynamic";
import { SearchBar } from "./SearchBar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Button } from "../ui/button";
import { Ellipsis, Filter } from "lucide-react";

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
        <div className="bg-neu1 col-span-12 flex gap-1 px-2 py-2 xl:pr-0">
          <SearchBar />
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="default" size="icon" className="md:hidden">
                <Filter className="size-4" />{" "}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Search Filters</DrawerTitle>
              </DrawerHeader>
              <div className="overflow-y-scroll">
                <SearchPanel {...props} />
              </div>
            </DrawerContent>
          </Drawer>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="">
                <Ellipsis className="size-4" />{" "}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <span
                  onClick={async () => {
                    await navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  Copy link to search
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="bg-neu1 hidden w-full md:col-span-5 md:flex lg:col-span-3 xl:col-span-5">
          <SearchPanel {...props} />
        </div>
        <div className="col-span-12 pr-2 md:col-span-7 lg:col-span-9 xl:col-span-7 xl:px-0">
          <SearchResults />
        </div>
      </div>
    </div>
  );
}
