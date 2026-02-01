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
import { Course } from "@sneu/scraper/types";
import SelectedCourseGroup from "./SelectedCourseGroup";
const ModalSearchResults = dynamic(() => import("./ModalSearchResults"), {
  ssr: false,
});

interface SelectedCourseGroup {
  parent: Course;
  coreqs: Course[];
  isLocked: boolean;
}

export default function AddCoursesModal(props: {
  open: boolean;
  closeFn: () => void;
  terms: Promise<GroupedTerms>;
  onGenerateSchedules: (
    lockedCourseIds: number[],
    optionalCourseIds: number[],
  ) => void;
}) {
  const [selectedCollege, setSelectedCollege] = useState<string>("neu");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCourseGroups, setSelectedCourseGroups] = useState<
    SelectedCourseGroup[]
  >([]);

  const handleSelectCourse = (course: Course) => {
    setSelectedCourseGroups((prev) => {
      // already selected
      if (
        prev.some(
          (g) =>
            g.parent.subject === course.subject &&
            g.parent.courseNumber === course.courseNumber,
        )
      ) {
        return prev;
      }

      if (prev.length >= 6) return prev;

      const coreqs = course.coreqs
        ? extractCoreqCourses(course.coreqs).map(
            (c) =>
              ({
                ...course,
                subject: c.subject,
                courseNumber: c.courseNumber,
              }) as Course,
          )
        : [];

      return [...prev, { parent: course, coreqs, isLocked: false }];
    });

    console.log("Selected courses:", selectedCourseGroups);
  };

  const clear = () => {
    setSelectedCollege("neu");
    setSelectedTerm(null);
    setSearchQuery("");
    setSelectedCourseGroups([]);
  };

  const handleDeleteGroup = (parent: Course) => {
    setSelectedCourseGroups((prev) =>
      prev.filter(
        (g) =>
          !(
            g.parent.subject === parent.subject &&
            g.parent.courseNumber === parent.courseNumber
          ),
      ),
    );
  };

  const isCourseCoreq = (
    req: any,
  ): req is { subject: string; courseNumber: string } => {
    return (
      req &&
      typeof req === "object" &&
      "subject" in req &&
      "courseNumber" in req
    );
  };

  const extractCoreqCourses = (
    req: any,
    acc: { subject: string; courseNumber: string }[] = [],
  ) => {
    if (!req || typeof req !== "object") return acc;

    // empty object {}
    if (Object.keys(req).length === 0) return acc;

    // single course
    if (isCourseCoreq(req)) {
      acc.push(req);
      return acc;
    }

    if ("type" in req && Array.isArray(req.items)) {
      req.items.forEach((item: any) => extractCoreqCourses(item, acc));
    }

    return acc;
  };

  const handleGeneratation = () => {
    // parse locked course IDs by checking which courses are locked
    const lockedCourseIds = selectedCourseGroups
      .filter((group) => group.isLocked)
      .map((group) => parseInt(group.parent.courseNumber));

    // parse optional course IDs
    const optionalCourseIds = selectedCourseGroups
      .filter((group) => !group.isLocked)
      .map((group) => parseInt(group.parent.courseNumber));

    if (lockedCourseIds.length > 0) {
      props.onGenerateSchedules(lockedCourseIds, optionalCourseIds);
    }

    // close modal and clear state
    props.closeFn();
    clear();
  };

  const handleToggleLock = (parent: Course) => {
    setSelectedCourseGroups((prev) =>
      prev.map((group) => {
        if (
          group.parent.subject === parent.subject &&
          group.parent.courseNumber === parent.courseNumber
        ) {
          return { ...group, isLocked: !group.isLocked };
        }
        return group;
      }),
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
          <div className="flex h-full min-h-0 w-1/2 flex-col gap-4 overflow-hidden max-[768px]:h-1/2 max-[768px]:w-full">
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
          <div className="flex w-1/2 flex-col gap-[10px] max-[768px]:h-1/2 max-[768px]:w-full">
            {/* selected courses panel */}
            <div className="bg-neu25 flex min-h-0 flex-1 flex-col rounded-lg p-[8px]">
              {selectedCourseGroups.length === 0 ? (
                <span className="text-neu6 flex h-full items-center justify-center text-sm">
                  No courses selected
                </span>
              ) : (
                <div className="flex min-h-0 flex-col gap-y-[4px] overflow-y-auto">
                  {selectedCourseGroups.map((group, index) => (
                    <SelectedCourseGroup
                      key={`${group.parent.subject}-${group.parent.courseNumber}-${index}`}
                      parent={group.parent}
                      coreqs={group.coreqs}
                      onDelete={() => handleDeleteGroup(group.parent)}
                      onToggleLock={() => handleToggleLock(group.parent)}
                      isLocked={group.isLocked}
                    />
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleGeneratation}>Generate Schedules</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
