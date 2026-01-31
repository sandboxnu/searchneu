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
import { ModalSearchBar } from "./ModalSearchBar";
import { searchResult } from "./ModalSearchResults";
import { DeleteIcon } from "../icons/Delete";
const ModalSearchResults = dynamic(() => import("./ModalSearchResults"), {
  ssr: false,
});

interface SelectedCourse {
  subject: string;
  courseNumber: string;
  title: string;
  handleDelete: () => void;
}

const SelectedCourseItem = (props: { course: SelectedCourse }) => {
  {
    return (
      <div className="text-neu6 hover:bg-neu2 bg-neu1 flex h-fit w-full flex-row items-center justify-between rounded-lg px-[16px] py-[12px] text-[12px] transition-colors">
        <p className="m-0 flex flex-row items-center justify-start gap-[8px]">
          <span className="text-neu8 text-[14px] font-bold">
            {props.course.subject} {props.course.courseNumber}
          </span>{" "}
          {props.course.title}
        </p>
        <button
          onClick={props.course.handleDelete}
          className="cursor-pointer rounded-md p-1"
        >
          <DeleteIcon />
        </button>
      </div>
    );
  }
};

export default function AddCoursesModal(props: {
  open: boolean;
  closeFn: () => void;
  terms: Promise<GroupedTerms>;
}) {
  const [selectedCollege, setSelectedCollege] = useState<string>("neu");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCourses, setSelectedCourses] = useState<searchResult[]>([]);

  const handleSelectCourse = (course: searchResult) => {
    const isAlreadySelected = selectedCourses.some(
      (c) =>
        c.subject === course.subject && c.courseNumber === course.courseNumber,
    );

    if (isAlreadySelected) return;

    // Limit to 6 courses
    if (selectedCourses.length >= 6) return;

    setSelectedCourses((prev) => [...prev, course]);
    console.log("Selected Courses:", selectedCourses);
  };

  const clear = () => {
    setSelectedCollege("neu");
    setSelectedTerm(null);
    setSearchQuery("");
    setSelectedCourses([]);
  };

  const handleDeleteCourse = (courseToDelete: searchResult) => {
    setSelectedCourses((prev) =>
      prev.filter(
        (course) =>
          !(
            course.subject === courseToDelete.subject &&
            course.courseNumber === courseToDelete.courseNumber
          ),
      ),
    );
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={() => {
        props.closeFn();
        clear();
      }}
    >
      <DialogContent className="flex h-[700px] flex-col items-start justify-start overflow-hidden px-[24px] py-[36px] sm:max-w-[925px]">
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
                onSelectCourse={handleSelectCourse}
              />
            )}
          </div>
          {/* selected course and generate button */}
          <div className="flex w-1/2 flex-col gap-[10px] max-[768px]:w-full">
            <div className="bg-neu25 flex h-full min-h-[250px] w-full flex-col rounded-lg p-[8px]">
              {/* display column of selected courses here */}
              {selectedCourses.length === 0 && (
                <span className="m-auto text-center text-gray-500">
                  No courses selected.
                </span>
              )}
              <div className="flex h-full flex-col gap-2 overflow-y-auto">
                {selectedCourses.map((course, index) => (
                  <SelectedCourseItem
                    key={`${course.subject}-${course.courseNumber}-${index}`}
                    course={{
                      subject: course.subject,
                      courseNumber: course.courseNumber,
                      title: course.name,
                      handleDelete: () => handleDeleteCourse(course),
                    }}
                  />
                ))}
              </div>
            </div>
            <Button>Generate Schedules</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
