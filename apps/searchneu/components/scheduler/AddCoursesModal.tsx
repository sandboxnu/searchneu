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
import { useState, use } from "react";
import { ModalSearchBar } from "./ModalSearchBar";
import { Course } from "@sneu/scraper/types";
import SelectedCourseGroup from "./SelectedCourseGroup";
const ModalSearchResults = dynamic(() => import("./ModalSearchResults"), {
  ssr: false,
});

interface SelectedCourseGroup {
  parent: Course;
  coreqs: Course[];
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCourseGroups, setSelectedCourseGroups] = useState<
    SelectedCourseGroup[]
  >([]);
  const [numCourses, setNumCourses] = useState<number>(1);

  const terms = use(props.terms);
  const hardcodedTerm = terms.neu[0]?.term ?? "";

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

      if (prev.length >= 10) return prev;

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
    setSearchQuery("");
    setSelectedCourseGroups([]);
    setNumCourses(1);
  };

  const handleDeleteGroup = (parent: Course) => {
    // deleting parent deletes whole group
    // deleting a child only deletes child

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

  const handleDeleteChild = (child: Course) => {
    setSelectedCourseGroups((prev) =>
      prev.map((group) => ({
        ...group,
        coreqs: group.coreqs.filter(
          (c) =>
            !(
              c.subject === child.subject &&
              c.courseNumber === child.courseNumber
            ),
        ),
      })),
    );
  };

  const handleDelete = (course: Course, isCoreq: boolean) => {
    if (isCoreq) {
      handleDeleteChild(course);
    } else {
      handleDeleteGroup(course);
    }
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

  const getSelectionTextWithCoreqs = () => {
    const numParentCourses = selectedCourseGroups.length;

    if (numParentCourses === 0) {
      return "No courses added.";
    }

    const numSelectedCoreqs = selectedCourseGroups.reduce(
      (acc, group) => acc + (group.coreqs?.length || 0),
      0,
    );

    const numTotalPossibleCoreqs = selectedCourseGroups.reduce((acc, group) => {
      const possible = group.parent.coreqs
        ? extractCoreqCourses(group.parent.coreqs).length
        : 0;
      return acc + possible;
    }, 0);

    const numAbsentCoreqs = numTotalPossibleCoreqs - numSelectedCoreqs;
    const parentText = `${numParentCourses} course${numParentCourses !== 1 ? "s" : ""} added`;
    const coreqText =
      numSelectedCoreqs > 0
        ? `, ${numSelectedCoreqs} corequisite${numSelectedCoreqs !== 1 ? "s" : ""} added`
        : "";

    const absentText =
      numAbsentCoreqs > 0
        ? `, ${numAbsentCoreqs} unadded corequisite${numAbsentCoreqs !== 1 ? "s" : ""}`
        : "";

    return `${parentText}${coreqText}${absentText}.`;
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={() => {
        props.closeFn();
        clear();
      }}
    >
      <DialogContent className="flex h-[700px] flex-col items-start justify-start overflow-hidden px-6 py-9 sm:max-w-[925px]">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle className="text-2xl font-bold">Add Courses</DialogTitle>
          <DialogDescription className="text-center">
            Add up to 6 courses{" "}
            <span className="italic">(excluding corequisites)</span> that you
            are considering for <span className="font-bold">Spring 2026.</span>
          </DialogDescription>
        </DialogHeader>
        {/* how many courses prompt */}
        <div className="flex w-full flex-col py-3">
          <hr className="text-neu4 mb-6 h-[0.5px] w-full" />
          <div className="flex w-full flex-row items-center justify-between max-[768px]:flex-col max-[768px]:gap-3 max-[768px]:text-center">
            <div className="text-neu8 text-[16px] max-[768px]:text-sm">
              How many courses are you taking this semester?
            </div>
            <div className="border-neu2 flex w-fit flex-row rounded-[28px] border bg-white p-1">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumCourses(num)}
                  className={`flex h-5.5 w-10.5 items-center justify-center rounded-[46px] px-2 py-1 text-xs font-semibold transition-colors ${
                    numCourses === num
                      ? "bg-red-500 text-white"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <hr className="text-neu4 mt-6 h-[0.5px] w-full" />
        </div>
        {/* main dialog content */}
        <div className="flex min-h-0 w-full flex-1 flex-row gap-2.5 max-[768px]:flex-col max-[768px]:gap-4">
          {/* selecting term, campus, search, and search results */}
          <div className="flex h-full min-h-0 w-1/2 flex-col gap-4 max-[768px]:h-1/2 max-[768px]:w-full">
            <ModalSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            {
              <ModalSearchResults
                searchQuery={searchQuery}
                term={hardcodedTerm}
                onSelectCourse={handleSelectCourse}
              />
            }
          </div>
          {/* selected course and generate button */}
          <div className="flex h-full min-h-0 w-1/2 flex-col gap-2.5 max-[768px]:h-1/2 max-[768px]:w-full">
            {/* selected courses panel */}
            <div className="bg-neu25 flex min-h-0 flex-1 flex-col gap-1 rounded-lg p-2">
              {/* number of selections label */}
              <div className="flex items-center justify-start p-2">
                <span className="text-neu5 text-xs">
                  {getSelectionTextWithCoreqs()}
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-y-1 overflow-y-auto">
                {selectedCourseGroups.map((group, index) => (
                  <SelectedCourseGroup
                    key={`${group.parent.subject}-${group.parent.courseNumber}-${index}`}
                    parent={group.parent}
                    coreqs={group.coreqs}
                    onDeleteCourse={(course, isCoreq) =>
                      handleDelete(course, isCoreq)
                    }
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleGeneratation}>Generate Schedules</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
