"use client";

import { SearchPanel } from "./SearchPanel";
import { GroupedTerms, Subject } from "@/lib/types";
import { useParams } from "next/navigation";
import { Option } from "../ui/multi-select";
import dynamic from "next/dynamic";
import { SearchBar } from "./SearchBar";
import { type ReactNode } from "react";

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
    <>
      <div
        data-show={!Boolean(course)}
        className="hidden rounded-t-lg data-[show=true]:block xl:block!"
      >
        <div className="grid h-full w-full grid-cols-5 px-6 py-2">
          <div className="col-span-1 w-full">
            <SearchPanel {...props} />
          </div>
          <div className="col-span-4 flex flex-col gap-4 pl-6">
            <SearchBar />
            <div className="grid grid-cols-12">
              <div className="col-span-4">
                <SearchResults />
              </div>
              <div className="col-span-8">{props.coursePage}</div>
            </div>

            {/* <Drawer> */}
            {/*   <DrawerTrigger asChild> */}
            {/*     <Button variant="default" size="icon" className="md:hidden"> */}
            {/*       <Filter className="size-4" />{" "} */}
            {/*     </Button> */}
            {/*   </DrawerTrigger> */}
            {/*   <DrawerContent> */}
            {/*     <DrawerHeader> */}
            {/*       <DrawerTitle>Search Filters</DrawerTitle> */}
            {/*     </DrawerHeader> */}
            {/*     <div className="overflow-y-scroll"> */}
            {/*       <SearchPanel {...props} /> */}
            {/*     </div> */}
            {/*   </DrawerContent> */}
            {/* </Drawer> */}

            {/* <DropdownMenu> */}
            {/*   <DropdownMenuTrigger asChild> */}
            {/*     <Button variant="outline" size="icon" className=""> */}
            {/*       <Ellipsis className="size-4" />{" "} */}
            {/*     </Button> */}
            {/*   </DropdownMenuTrigger> */}
            {/*   <DropdownMenuContent> */}
            {/*     <DropdownMenuItem asChild> */}
            {/*       <span */}
            {/*         onClick={async () => { */}
            {/*           await navigator.clipboard.writeText(window.location.href); */}
            {/*         }} */}
            {/*       > */}
            {/*         Copy link to search */}
            {/*       </span> */}
            {/*     </DropdownMenuItem> */}
            {/*   </DropdownMenuContent> */}
            {/* </DropdownMenu> */}
          </div>
        </div>
      </div>
    </>
  );
}
