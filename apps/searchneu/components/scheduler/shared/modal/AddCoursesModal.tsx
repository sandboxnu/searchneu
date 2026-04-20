"use client";

import {
  Course,
  CourseSearchResult,
  GroupedTerms,
  Term,
} from "@/lib/catalog/types";
import {
  extractCoreqReqs,
  fetchCoreqCourses,
  fetchCourseById,
  getSelectionText,
  isAlreadySelected,
  isCourseMatch,
  sortGroups,
} from "@/lib/scheduler/addCourseModal";
import {
  CourseReq,
  ModalCourse,
  SelectedCourseGroupData,
} from "@/lib/scheduler/types";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import { ModalSearchBar } from "./ModalSearchBar";
import SelectedCourseGroup from "./SelectedCourseGroup";

const ModalSearchResults = dynamic(() => import("./ModalSearchResults"), {
  ssr: false,
});

interface AddCoursesModalProps {
  open: boolean;
  closeFn: () => void;
  terms: GroupedTerms;
  selectedTerm: Term | null;
  initialCourseIds: number[];
  initialNumCourses?: number;
  onGenerate: (courseIds: number[], numCourses: number) => void;
}

export default function AddCoursesModal({
  open,
  closeFn,
  terms,
  selectedTerm,
  initialCourseIds,
  initialNumCourses,
  onGenerate,
}: AddCoursesModalProps) {
  const [numCourses, setNumCourses] = useState<number>(initialNumCourses ?? 4);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseGroups, setSelectedCourseGroups] = useState<
    SelectedCourseGroupData[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync selected number of courses if it was anything other than default
  useEffect(() => {
    if (open && initialNumCourses != null) {
      setNumCourses(initialNumCourses);
    }
  }, [open, initialNumCourses]);

  const activeTerm = selectedTerm ?? terms.neu[0];
  const activeTermLabel = Object.values(terms)
    .flat()
    .find((t) => t.term === activeTerm.term)?.name;

  const fetchCoreqs = useCallback(
    (course: ModalCourse, currentGroups: SelectedCourseGroupData[]) =>
      fetchCoreqCourses(course, currentGroups, activeTerm),
    [activeTerm],
  );
  useEffect(() => {
    if (!open || initialCourseIds.length === 0) return;

    const syncInitialCourses = async () => {
      const rawResults = await Promise.all(
        initialCourseIds.map(fetchCourseById),
      );
      const fetchedCourses = rawResults.filter((r): r is Course => r !== null);

      const newGroups: SelectedCourseGroupData[] = [];
      for (const course of fetchedCourses) {
        if (isAlreadySelected(newGroups, course) || newGroups.length >= 10)
          continue;
        const coreqs = await fetchCoreqs(course, newGroups);
        newGroups.push({ parent: course, coreqs });
      }
      setSelectedCourseGroups(newGroups);
    };

    syncInitialCourses();
  }, [open, initialCourseIds, activeTerm, fetchCoreqs]);

  const handleGenerateSchedules = useCallback(
    async (courseIds: number[], numCoursesValue: number) => {
      setIsGenerating(true);
      try {
        onGenerate(courseIds, numCoursesValue);
        closeFn();
      } catch (error) {
        console.error("Error generating schedules:", error);
      } finally {
        setIsGenerating(false);
      }
    },
    [onGenerate, closeFn],
  );

  const handleSelectCourse = async (course: CourseSearchResult) => {
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

  const handleDelete = (course: ModalCourse, isCoreq: boolean) => {
    setSelectedCourseGroups((prev) =>
      isCoreq
        ? prev.map((g) => ({
            ...g,
            coreqs: g.coreqs.filter((c) => !isCourseMatch(c, course)),
          }))
        : prev.filter((g) => !isCourseMatch(g.parent, course)),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeFn()}>
      <DialogContent className="flex h-[700px] w-8/10 flex-col items-start justify-start overflow-hidden px-6 py-9 md:max-w-[925px] [&_[data-slot=dialog-close]]:cursor-pointer">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle className="text-2xl font-bold">Add Courses</DialogTitle>
          <DialogDescription className="text-center">
            Add up to 6 courses{" "}
            <span className="italic">(including corequisites)</span> for{" "}
            <span className="font-bold">
              {activeTermLabel?.split(" ").slice(0, 2).join(" ")}.
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
            {searchQuery && (
              <ModalSearchResults
                searchQuery={searchQuery}
                term={activeTerm}
                onSelectSearchResult={handleSelectCourse}
              />
            )}
          </div>

          <div className="flex h-full w-1/2 flex-col gap-2.5 max-[768px]:w-full">
            <div className="bg-neu25 flex min-h-0 flex-1 flex-col rounded-lg p-2">
              <div className="text-neu5 p-2 text-xs">
                {getSelectionText(selectedCourseGroups)}
              </div>
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
                isGenerating ||
                selectedCourseGroups.length +
                  selectedCourseGroups.flatMap((g) => g.coreqs).length <
                  numCourses
              }
              onClick={() => {
                const allCourseIds = selectedCourseGroups.flatMap((g) => [
                  g.parent.id,
                  ...g.coreqs.map((c) => c.id),
                ]);
                handleGenerateSchedules(allCourseIds, numCourses);
              }}
            >
              {isGenerating ? "Generating Schedules..." : "Generate Schedules"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
