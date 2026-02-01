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
import { DeleteIcon } from "../icons/Delete";
import { Course } from "@sneu/scraper/types";
const ModalSearchResults = dynamic(() => import("./ModalSearchResults"), {
  ssr: false,
});

interface SelectedCourseGroup {
  parent: Course;
  coreqs: Course[];
}

interface SelectedCourse {
  subject: string;
  courseNumber: string;
  title: string;
  handleDelete: () => void;
  isGrouped?: boolean;
}

const SelectedCourseItem = ({ course }: { course: SelectedCourse }) => {
  const containerClass = [
    "group text-neu6 hover:bg-neu2 bg-neu1 flex h-[50px] w-full flex-row items-center justify-between px-[16px] text-[12px] transition-colors",
    course.isGrouped ? "rounded-none" : "rounded-lg",
  ].join(" ");

  return (
    <div className={containerClass}>
      <p className="m-0 flex min-w-0 items-center gap-[8px]">
        <span className="text-neu8 shrink-0 text-[14px] font-bold">
          {course.subject} {course.courseNumber}
        </span>
        <span className="truncate">{course.title}</span>
      </p>
      <button
        onClick={course.handleDelete}
        className="invisible cursor-pointer rounded-md p-1 group-hover:visible"
      >
        <DeleteIcon />
      </button>
    </div>
  );
};

const SelectedCourseGroup = ({
  parent,
  coreqs,
  onDelete,
}: {
  parent: Course;
  coreqs: Course[];
  onDelete: () => void;
}) => {
  return (
    <div className="border-neu3 flex flex-col overflow-hidden rounded-lg border">
      {/* parent */}
      <SelectedCourseItem
        course={{
          subject: parent.subject,
          courseNumber: parent.courseNumber,
          title: parent.name,
          handleDelete: onDelete,
          isGrouped: coreqs.length > 0,
        }}
      />

      {/* coreqs */}
      {coreqs.map((coreq, idx) => (
        <div key={idx} className="border-neu3 border-t">
          <SelectedCourseItem
            course={{
              subject: coreq.subject,
              courseNumber: coreq.courseNumber,
              title: coreq.name ?? "Corequisite",
              handleDelete: onDelete, // deleting parent deletes whole group
              isGrouped: true,
            }}
          />
        </div>
      ))}
    </div>
  );
};

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

      return [...prev, { parent: course, coreqs }];
    });
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
    // parse locked course IDs
    const lockedCourseIds = selectedCourseGroups.map((group) =>
      parseInt(group.parent.courseNumber),
    );
    // parse optional course IDs
    const optionalCourseIds: number[] = [];
    if (lockedCourseIds.length > 0) {
      props.onGenerateSchedules(lockedCourseIds, optionalCourseIds);
    }

    // close modal and clear state
    props.closeFn();
    clear();
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
