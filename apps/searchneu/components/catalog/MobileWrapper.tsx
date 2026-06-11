"use client";

import { SearchPanel, type CatalogFilterData } from "./search/SearchPanel";
import { useParams, useSearchParams } from "next/navigation";
import { SearchBar } from "./search/SearchBar";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { SearchResults } from "./search/SearchResults";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import { ListFilter } from "lucide-react";
import { Button } from "../ui/button";

export function MobileWrapper(
  props: CatalogFilterData & {
    coursePage: ReactNode;
  },
) {
  const { course } = useParams();
  const searchParams = useSearchParams();
  const [newSearch, setNewSearch] = useState(false);

  useEffect(() => {
    // WARN: we should obv fix this and remove the ignore
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewSearch(true);
  }, [searchParams]);

  useEffect(() => {
    // WARN: we should obv fix this and remove the ignore
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewSearch(false);
  }, [course]);

  return (
    <div className="flex min-h-0 w-screen min-w-0 flex-1 px-4 pt-4 xl:px-6">
      <div
        data-show={Boolean(course)}
        className="hidden h-full min-h-0 w-full max-w-70 md:block md:data-[show=true]:hidden xl:block!"
      >
        <SearchPanel {...props} />
      </div>
      <div
        data-show={Boolean(course)}
        className="flex min-h-0 w-full min-w-0 flex-col gap-3 md:data-[show=false]:pl-3 md:data-[show=true]:pl-0 xl:pl-3!"
      >
        <div data-show={Boolean(course)} className="flex items-center gap-2">
          <Drawer repositionInputs={false}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-neu1 rounded-full md:hidden"
              >
                <ListFilter className="text-neu6 size-4" strokeWidth={2} />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="data-[vaul-drawer-direction=bottom]:h-[95dvh] data-[vaul-drawer-direction=bottom]:max-h-[95dvh]">
              <DrawerTitle className="text-center">Catalog Filters</DrawerTitle>
              <div className="flex min-h-0 flex-1">
                <SearchPanel {...props} />
              </div>
              <DrawerFooter className="">
                <DrawerClose asChild>
                  <Button className="rounded-full">View all results</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>

          <SearchBar />
        </div>
        <div className="flex h-full min-h-0 w-full min-w-0">
          <div
            data-show={Boolean(course)}
            data-firsttime={Boolean(newSearch)}
            className="w-full data-[firsttime=true]:data-[show=false]:block data-[firsttime=false]:data-[show=true]:hidden xl:block! xl:max-w-[320px]"
          >
            <Suspense fallback={null}>
              <SearchResults />
            </Suspense>
          </div>
          <div
            data-show={Boolean(course)}
            data-firsttime={Boolean(newSearch)}
            className="hidden min-w-0 flex-1 data-[firsttime=false]:data-[show=true]:block xl:block"
          >
            {props.coursePage}
          </div>
        </div>
      </div>
    </div>
  );
}
