"use client";

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
import { useState, use, useEffect } from "react";
import { ModalSearchBar } from "./ModalSearchBar";
import SelectedCourseGroup from "./SelectedCourseGroup";
import { Course } from "@sneu/scraper/types";
import { useSearchParams } from "next/navigation";
import { getCourse, getCourseById } from "@/lib/controllers/getCourse";
const ModalSearchResults = dynamic(() => import("./ModalSearchResults"), {
  ssr: false,
});

interface SelectedCourseGroupData {
  parent: Course;
  coreqs: Course[];
}

const isCourseCoreq = (req: { subject: string; courseNumber: string }) => {
  return (
    req && typeof req === "object" && "subject" in req && "courseNumber" in req
  );
};

const extractCoreqCourses = (
  req: any,
  acc: { subject: string; courseNumber: string }[] = [],
) => {
  if (!req || typeof req !== "object") return acc;

  // empty object
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

export default function AddCoursesModal(props: {
  open: boolean;
  closeFn: () => void;
  terms: Promise<GroupedTerms>;
  selectedTerm: string | null;
  onGenerateSchedules: (
    lockedCourseIds: number[],
    optionalCourseIds: number[],
    numCourses?: number,
  ) => void;
}) {
  const searchParams = useSearchParams();

  const rawLocked = searchParams.getAll("lockedCourseIds");
  const rawOptional = searchParams.getAll("optionalCourseIds");

  const parseIds = (raw: string[]) => {
    return raw
      .flatMap((val) => val.split(","))
      .map(Number)
      .filter((id) => !isNaN(id) && id > 0);
  };

  const lockedCourseIds = parseIds(rawLocked);
  const optionalCourseIds = parseIds(rawOptional);
  const allCourseIds = lockedCourseIds.concat(optionalCourseIds);
  const parsedNum = parseInt(searchParams.get("numCourses") ?? "1");
  const numCoursesValue = isNaN(parsedNum) ? 1 : parsedNum;

  const [numCourses, setNumCourses] = useState<number>(numCoursesValue);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCourseGroups, setSelectedCourseGroups] = useState<
    SelectedCourseGroupData[]
  >([]);

  const terms = use(props.terms);
  const activeTerm = props.selectedTerm ?? terms.neu[0]?.term ?? "";
  const activeTermLabel =
    Object.values(terms)
      .flat()
      .find((t) => t.term === activeTerm)?.name ?? "Selected Term";

  const handleSelectCourse = async (course: Course) => {
    const isCourseSelected = selectedCourseGroups.some(
      (g) =>
        (g.parent.subject === course.subject &&
          g.parent.courseNumber === course.courseNumber) ||
        g.coreqs.some(
          (c) =>
            c.subject === course.subject &&
            c.courseNumber === course.courseNumber,
        ),
    );

    if (isCourseSelected || selectedCourseGroups.length >= 10) return;

    const allCoreqReqs = extractCoreqCourses(course.coreqs);

    // filter for coreqs not already selected to avoid duplicates
    const neededCoreqReqs = allCoreqReqs.filter((req) => {
      const isAlreadyInSchedule = selectedCourseGroups.some(
        (g) =>
          // check parent courses
          (g.parent.subject === req.subject &&
            g.parent.courseNumber === req.courseNumber) ||
          // check already selected coreqs
          g.coreqs.some(
            (c) =>
              c.subject === req.subject && c.courseNumber === req.courseNumber,
          ),
      );
      return !isAlreadyInSchedule;
    });

    const rawResults = await Promise.all(
      neededCoreqReqs.map(async (c) => {
        const rows = await getCourse(activeTerm, c.subject, c.courseNumber);
        const res = rows[0];
        if (!res) return null;

        return {
          ...res,
          subject: c.subject,
          minCredits: Number(res.minCredits),
          maxCredits: Number(res.maxCredits),
          specialTopics: false,
          attributes: res.nupaths || [],
        } as Course;
      }),
    );

    const validCoreqs = rawResults.filter((c): c is Course => c !== null);
    setSelectedCourseGroups((prev) => [
      ...prev,
      { parent: course, coreqs: validCoreqs },
    ]);
  };

  useEffect(() => {
    if (allCourseIds.length === 0) return;

    const populateSelectedCourses = async () => {
      const rawResults = await Promise.all(
        allCourseIds.map((id) => getCourseById(id)),
      );
      const fetchedCourses = rawResults.map((res) => res[0]).filter(Boolean);

      const newGroups: SelectedCourseGroupData[] = [];

      for (const course of fetchedCourses) {
        const mappedCourse = {
          ...course,
          minCredits: Number(course.minCredits),
          maxCredits: Number(course.maxCredits),
          specialTopics: false,
          attributes: course.nupaths || [],
        } as Course;

        const isAlreadyAdded = newGroups.some(
          (g) =>
            (g.parent.subject === mappedCourse.subject &&
              g.parent.courseNumber === mappedCourse.courseNumber) ||
            g.coreqs.some(
              (c) =>
                c.subject === mappedCourse.subject &&
                c.courseNumber === mappedCourse.courseNumber,
            ),
        );

        if (isAlreadyAdded || newGroups.length >= 10) continue;

        const allCoreqReqs = extractCoreqCourses(mappedCourse.coreqs);
        const neededCoreqReqs = allCoreqReqs.filter((req) => {
          return !newGroups.some(
            (g) =>
              (g.parent.subject === req.subject &&
                g.parent.courseNumber === req.courseNumber) ||
              g.coreqs.some(
                (c) =>
                  c.subject === req.subject &&
                  c.courseNumber === req.courseNumber,
              ),
          );
        });

        const rawCoreqResults = await Promise.all(
          neededCoreqReqs.map(async (c) => {
            const rows = await getCourse(activeTerm, c.subject, c.courseNumber);
            const res = rows[0];
            if (!res) return null;
            return {
              ...res,
              subject: c.subject,
              minCredits: Number(res.minCredits),
              maxCredits: Number(res.maxCredits),
              specialTopics: false,
              attributes: res.nupaths || [],
            } as Course;
          }),
        );

        const validCoreqs = rawCoreqResults.filter(
          (c): c is Course => c !== null,
        );

        newGroups.push({ parent: mappedCourse, coreqs: validCoreqs });
      }

      setSelectedCourseGroups(newGroups);
    };

    populateSelectedCourses();
  }, [activeTerm]);

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

  const handleGeneratation = () => {
    const optionalCourseIds = selectedCourseGroups.flatMap((group) => [
      group.parent.id,
      ...group.coreqs.map((c) => c.id),
    ]);

    if (optionalCourseIds.length > 0) {
      props.onGenerateSchedules([], optionalCourseIds, numCourses);
    }

    props.closeFn();
  };

  const hasEnoughCourses = () => {
    const parentCourses = selectedCourseGroups.map((group) => group.parent);
    const coreqCourses = selectedCourseGroups.flatMap((group) => group.coreqs);
    const totalCourses = parentCourses.length + coreqCourses.length;

    return totalCourses >= numCourses;
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
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          props.closeFn();
        }
      }}
    >
      <DialogContent className="flex h-[700px] w-8/10 flex-col items-start justify-start overflow-hidden px-6 py-9 md:max-w-[925px]">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle className="text-2xl font-bold">Add Courses</DialogTitle>
          <DialogDescription className="text-center">
            Add up to 6 courses{" "}
            <span className="italic">(excluding corequisites)</span> that you
            are considering for{" "}
            <span className="font-bold">
              {activeTermLabel.split(" ")[0] +
                " " +
                activeTermLabel.split(" ")[1] +
                "."}
            </span>
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
                  className={`flex h-5.5 w-10.5 cursor-pointer items-center justify-center rounded-[46px] px-2 py-1 text-xs font-semibold transition-colors ${
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
                term={activeTerm}
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

            <Button
              disabled={!hasEnoughCourses()}
              onClick={handleGeneratation}
              className="cursor-pointer"
            >
              Generate Schedules
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
