import { GroupedTerms } from "@/lib/types";
import { CollegeSelect } from "../catalog/search/CollegeSelect";
import { SearchBar } from "../catalog/search/SearchBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { TermSelect } from "../catalog/search/TermSelect";
import dynamic from "next/dynamic";
import { Button } from "../ui/button";
const SearchResults = dynamic(() => import("../catalog/search/SearchResults"), {
  ssr: false,
});

export default function AddCoursesModal(props: {
  open: boolean;
  closeFn: () => void;
  terms: Promise<GroupedTerms>;
}) {
  // keep track of selected term and campus
  // keep track of search query (deviate from search pattern of having it in URL params bc this is a modal)
  // keep track of search results
  // keep track of selected courses to add
  return (
    <Dialog open={props.open} onOpenChange={() => props.closeFn()}>
      <DialogContent className="flex h-[700px] flex-col items-start justify-start px-8 px-[24px] py-[36px] sm:max-w-[925px]">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle className="text-2xl font-bold">Add Courses</DialogTitle>
          <DialogDescription className="text-center">
            Add up to 10 courses that you are considering for{" "}
            <span className="font-bold">Spring 2026.</span>
          </DialogDescription>
        </DialogHeader>
        {/* main dialog content */}
        <div className="flex h-full w-full flex-row gap-[10px] p-3 max-[768px]:flex-col">
          {/* selecting term, campus, search, and search results */}
          <div className="flex h-auto w-1/2 flex-col gap-4 max-[768px]:w-full">
            <CollegeSelect terms={props.terms} />
            <SearchBar />
            {/* search results */}
          </div>
          {/* selected course and generate button */}
          <div className="flex w-1/2 flex-col gap-[10px] max-[768px]:w-full">
            <div className="bg-neu25 flex h-full min-h-[250px] w-full flex-col rounded-lg"></div>
            <Button>Generate Schedules</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
