"use client";

import { GroupedTerms } from "@/lib/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import dynamic from "next/dynamic";
import { Button } from "../ui/button";
import { useState, use, useEffect, useCallback } from "react";
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

interface CourseReq {
  subject?: string;
  courseNumber?: string;
  type?: string;
  items?: CourseReq[];
}

const mapToCourse = (raw: Course): Course => ({
  ...raw,
  minCredits: Number(raw.minCredits),
  maxCredits: Number(raw.maxCredits),
  specialTopics: false,
  attributes: raw.attributes || [],
});

const isCourseMatch = (
  c1: { subject: string; courseNumber: string },
  c2: { subject: string; courseNumber: string },
) => c1.subject === c2.subject && c1.courseNumber === c2.courseNumber;

const isAlreadySelected = (
  groups: SelectedCourseGroupData[],
  course: { subject: string; courseNumber: string },
) =>
  groups.some(
    (g) =>
      isCourseMatch(g.parent, course) ||
      g.coreqs.some((c) => isCourseMatch(c, course)),
  );

const extractCoreqReqs = (
  req: CourseReq | null | undefined,
  acc: { subject: string; courseNumber: string }[] = [],
): { subject: string; courseNumber: string }[] => {
  if (!req || typeof req !== "object") return acc;

  if (req.subject && req.courseNumber) {
    acc.push({ subject: req.subject, courseNumber: req.courseNumber });
  } else if (req.items && Array.isArray(req.items)) {
    req.items.forEach((item) => extractCoreqReqs(item, acc));
  }
  return acc;
};

export default function AddCoursesModal(props: {
  open: boolean;
  closeFn: () => void;
  terms: Promise<GroupedTerms>;
  selectedTerm: string | null;
  onGenerateSchedules: (
    locked: number[],
    optional: number[],
    num?: number,
  ) => void;
}) {
  const searchParams = useSearchParams();
  const terms = use(props.terms);

  const parsedNum = parseInt(searchParams.get("numCourses") ?? "1");
  const numCoursesValue = isNaN(parsedNum) ? 1 : parsedNum;

  const [numCourses, setNumCourses] = useState<number>(numCoursesValue);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseGroups, setSelectedCourseGroups] = useState<
    SelectedCourseGroupData[]
  >([]);

  const activeTerm = props.selectedTerm ?? terms.neu[0]?.term ?? "";
  const activeTermLabel =
    Object.values(terms)
      .flat()
      .find((t) => t.term === activeTerm)?.name ?? "Selected Term";

  const allCourseIds = [
    ...searchParams.getAll("lockedCourseIds"),
    ...searchParams.getAll("optionalCourseIds"),
  ]
    .flatMap((val) => val.split(","))
    .map(Number)
    .filter((id) => !isNaN(id) && id > 0);

  // helpers

  const fetchCoreqs = useCallback(
    async (course: Course, currentGroups: SelectedCourseGroupData[]) => {
      const allReqs = extractCoreqReqs(course.coreqs as CourseReq);
      const neededReqs = allReqs.filter(
        (req) => !isAlreadySelected(currentGroups, req),
      );

      const results = await Promise.all(
        neededReqs.map(async (req) => {
          const rows = await getCourse(
            activeTerm,
            req.subject,
            req.courseNumber,
          );
          return rows[0]
            ? mapToCourse({
                ...(rows[0] as unknown as Course),
                subject: req.subject,
              })
            : null;
        }),
      );
      return results.filter((c): c is Course => c !== null);
    },
    [activeTerm],
  );

  const sortGroups = (
    groups: SelectedCourseGroupData[],
  ): SelectedCourseGroupData[] => {
    return [...groups].map((group) => {
      const allInGroup = [group.parent, ...group.coreqs].sort((a, b) =>
        a.courseNumber.localeCompare(b.courseNumber, undefined, {
          numeric: true,
        }),
      );

      return {
        parent: allInGroup[0],
        coreqs: allInGroup.slice(1),
      };
    });
  };

  const handleSelectCourse = async (course: Course) => {
    if (
      isAlreadySelected(selectedCourseGroups, course) ||
      selectedCourseGroups.length >= 10
    )
      return;

    const parentGroupIndex = selectedCourseGroups.findIndex((g) => {
      const parentCoreqReqs = extractCoreqReqs(g.parent.coreqs as CourseReq);
      return parentCoreqReqs.some((req) => isCourseMatch(req, course));
    });

    if (parentGroupIndex !== -1) {
      setSelectedCourseGroups((prev) => {
        const next = [...prev];

        const groupToUpdate = next[parentGroupIndex];
        const updatedGroup = {
          ...groupToUpdate,
          coreqs: [...groupToUpdate.coreqs, course],
        };

        const sortedArray = sortGroups([updatedGroup]);
        next[parentGroupIndex] = sortedArray[0];

        return sortGroups(next);
      });
      return;
    }

    const validCoreqs = await fetchCoreqs(course, selectedCourseGroups);
    setSelectedCourseGroups((prev) =>
      sortGroups([...prev, { parent: course, coreqs: validCoreqs }]),
    );
  };

  useEffect(() => {
    if (allCourseIds.length === 0) return;

    const syncFromUrl = async () => {
      const rawResults = await Promise.all(
        allCourseIds.map((id) => getCourseById(id)),
      );
      const fetchedCourses = rawResults.map((res) => res[0]).filter(Boolean);

      const newGroups: SelectedCourseGroupData[] = [];
      for (const raw of fetchedCourses) {
        const course = mapToCourse(raw as unknown as Course);
        if (isAlreadySelected(newGroups, course) || newGroups.length >= 10)
          continue;
        const coreqs = await fetchCoreqs(course, newGroups);
        newGroups.push({ parent: course, coreqs });
      }
      setSelectedCourseGroups(newGroups);
    };

    syncFromUrl();
  }, [activeTerm]);

  const handleDelete = (course: Course, isCoreq: boolean) => {
    setSelectedCourseGroups((prev) =>
      isCoreq
        ? prev.map((g) => ({
            ...g,
            coreqs: g.coreqs.filter((c) => !isCourseMatch(c, course)),
          }))
        : prev.filter((g) => !isCourseMatch(g.parent, course)),
    );
  };

  const getSelectionText = () => {
    const parents = selectedCourseGroups.length;
    if (parents === 0) return "No courses added.";
    const coreqs = selectedCourseGroups.reduce(
      (acc, g) => acc + g.coreqs.length,
      0,
    );
    const possible = selectedCourseGroups.reduce(
      (acc, g) => acc + extractCoreqReqs(g.parent.coreqs as CourseReq).length,
      0,
    );
    const absent = possible - coreqs;

    return `${parents} course${parents !== 1 ? "s" : ""} added${
      coreqs > 0
        ? `, ${coreqs} corequisite${coreqs !== 1 ? "s" : ""} added`
        : ""
    }${absent > 0 ? `, ${absent} unadded corequisite${absent !== 1 ? "s" : ""}` : ""}.`;
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.closeFn()}>
      <DialogContent className="flex h-[700px] w-8/10 flex-col items-start justify-start overflow-hidden px-6 py-9 md:max-w-[925px] [&_[data-slot=dialog-close]]:cursor-pointer">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle className="text-2xl font-bold">Add Courses</DialogTitle>
          <DialogDescription className="text-center">
            Add up to 6 courses{" "}
            <span className="italic">(excluding corequisites)</span> for{" "}
            <span className="font-bold">
              {activeTermLabel.split(" ").slice(0, 2).join(" ")}.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-full flex-col py-3">
          <hr className="mb-6 h-[0.5px] w-full" />
          <div className="flex w-full items-center justify-between max-[768px]:flex-col">
            <div className="text-neu8 text-[16px]">
              How many courses are you taking?
            </div>
            <div className="border-neu2 flex rounded-[28px] border bg-white p-1">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setNumCourses(num)}
                  className={`flex h-5.5 w-10.5 cursor-pointer items-center justify-center rounded-[46px] text-xs font-semibold ${
                    numCourses === num
                      ? "bg-red-500 text-white"
                      : "hover:bg-muted"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <hr className="mt-6 h-[0.5px] w-full" />
        </div>

        <div className="flex min-h-0 w-full flex-1 gap-2.5 max-[768px]:flex-col">
          <div className="flex h-full w-1/2 flex-col gap-4 max-[768px]:w-full">
            <ModalSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            <ModalSearchResults
              searchQuery={searchQuery}
              term={activeTerm}
              onSelectCourse={handleSelectCourse}
            />
          </div>

          <div className="flex h-full w-1/2 flex-col gap-2.5 max-[768px]:w-full">
            <div className="bg-neu25 flex min-h-0 flex-1 flex-col rounded-lg p-2">
              <div className="text-neu5 p-2 text-xs">{getSelectionText()}</div>
              <div className="flex flex-1 flex-col gap-y-1 overflow-y-auto">
                {selectedCourseGroups.map((group, i) => (
                  <SelectedCourseGroup
                    key={`${group.parent.id}-${i}`}
                    parent={group.parent}
                    coreqs={group.coreqs}
                    onDeleteCourse={handleDelete}
                  />
                ))}
              </div>
            </div>
            <Button
              className="cursor-pointer"
              disabled={
                selectedCourseGroups.length +
                  selectedCourseGroups.flatMap((g) => g.coreqs).length <
                numCourses
              }
              onClick={() => {
                props.onGenerateSchedules(
                  // ASK: do we want to reset all the locks whenever editing a schedule?
                  // the user would have to manually lock them again after generation
                  [],
                  selectedCourseGroups.flatMap((g) => [
                    g.parent.id,
                    ...g.coreqs.map((c) => c.id),
                  ]),
                  numCourses,
                );
                props.closeFn();
              }}
            >
              Generate Schedules
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
