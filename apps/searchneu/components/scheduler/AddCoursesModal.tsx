import { GroupedTerms } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import dynamic from "next/dynamic";
import { Button } from "../ui/button";
import { CollegeDropdown } from "./CollegeDropdown";
import { useState } from "react";
import ModalSearchResults from "./ModalSearchResults";
import { ModalSearchBar } from "./ModalSearchBar";
const SearchResults = dynamic(() => import("../catalog/search/SearchResults"), {
  ssr: false,
});

export default function AddCoursesModal(props: {
  open: boolean;
  closeFn: () => void;
  terms: Promise<GroupedTerms>;
}) {
  const [selectedCollege, setSelectedCollege] = useState<string>("neu");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);

  // keep track of selected term and campus
  // keep track of search query (deviate from search pattern of having it in URL params bc this is a modal)
  // keep track of search results
  // keep track of selected courses to add
  return (
    <Dialog open={props.open} onOpenChange={() => props.closeFn()}>
      <DialogContent className="flex h-[700px] flex-col items-start justify-start px-[24px] py-[36px] sm:max-w-[925px]">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle className="text-2xl font-bold">Add Courses</DialogTitle>
          <DialogDescription className="text-center">
            Add up to 10 courses that you are considering for{" "}
            <span className="font-bold">Spring 2026.</span>
          </DialogDescription>
        </DialogHeader>
        {/* main dialog content */}
        <div className="flex h-full w-full flex-row gap-[10px] pb-[72px] max-[768px]:flex-col max-[768px]:gap-4">
          {/* selecting term, campus, search, and search results */}
          <div className="flex h-full min-h-0 w-1/2 flex-col gap-4 overflow-hidden max-[768px]:w-full">
            <CollegeDropdown
              terms={props.terms}
              selectedCollege={selectedCollege}
              onCollegeChange={setSelectedCollege}
              onTermChange={setSelectedTerm}
            />
            <ModalSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            {selectedTerm && (
              <ModalSearchResults
                searchQuery={searchQuery}
                term={selectedTerm}
                course=""
              />
            )}
          </div>
          {/* selected course and generate button */}
          <div className="flex w-1/2 flex-col gap-[10px] max-[768px]:w-full">
            <div className="bg-neu25 flex h-full min-h-[250px] w-full flex-col rounded-lg p-[8px]">
              {/* display column of selected courses here */}
            </div>
            <Button>Generate Schedules</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
