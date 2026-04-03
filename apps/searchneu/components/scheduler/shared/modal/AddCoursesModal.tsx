"use client";

import {
  Course,
  GroupedTerms,
  CourseSearchResult,
  Term,
} from "@/lib/catalog/types";
import {
  extractCoreqReqs,
  fetchCoreqCourses,
  fetchCourseById,
  fetchSectionsForCourses,
  getSelectionText,
  isAlreadySelected,
  isCourseMatch,
  sortGroups,
} from "@/lib/scheduler/addCourseModal";
import {
  CourseReq,
  ExistingPlanData,
  ModalCourse,
  SelectedCourseGroupData,
} from "@/lib/scheduler/types";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
  planId?: number;
  callback?: () => void;
}

export default function AddCoursesModal(props: AddCoursesModalProps) {
  const router = useRouter();

  const [numCourses, setNumCourses] = useState<number>(4);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseGroups, setSelectedCourseGroups] = useState<
    SelectedCourseGroupData[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialExistingPlan, setInitialExistingPlan] =
    useState<ExistingPlanData | null>(null);

  // Fetch existing plan data if planId is provided (for updating)
  // Refetch whenever the modal is opened to ensure we have the latest plan data
  useEffect(() => {
    if (!props.planId || !props.open) return;

    const fetchExistingPlan = async () => {
      try {
        const res = await fetch(`/api/scheduler/saved-plans/${props.planId}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const planData = await res.json();
          setInitialExistingPlan(planData);
          if (planData.numCourses !== undefined) {
            setNumCourses(planData.numCourses);
          }
        }
      } catch (error) {
        console.error("Error fetching existing plan:", error);
      }
    };

    fetchExistingPlan();
  }, [props.planId, props.open]);

  const activeTerm = props.selectedTerm ?? props.terms.neu[0];
  const activeTermLabel = Object.values(props.terms)
    .flat()
    .find((t) => t.term === activeTerm.term)?.name;

  const fetchCoreqs = useCallback(
    (course: ModalCourse, currentGroups: SelectedCourseGroupData[]) =>
      fetchCoreqCourses(course, currentGroups, activeTerm),
    [activeTerm],
  );

  const handleGenerateSchedules = useCallback(
    async (courseIds: number[], numCoursesValue: number) => {
      setIsGenerating(true);
      try {
        // Fetch latest plan data in case filters were updated while modal was open
        let latestPlanData: ExistingPlanData | null = null;
        if (props.planId) {
          try {
            const res = await fetch(
              `/api/scheduler/saved-plans/${props.planId}`,
              { cache: "no-store" },
            );
            if (res.ok) {
              latestPlanData = await res.json();
            }
          } catch (error) {
            console.error("Error fetching latest plan data:", error);
          }
        }

        const sectionsByCourseId = await fetchSectionsForCourses(courseIds);

        // Build courses array, preserving lock/hidden status from the latest plan data
        const existingPlanForUpdate = latestPlanData || initialExistingPlan;
        const courses = courseIds.map((courseId) => {
          const sections = sectionsByCourseId.get(courseId) ?? [];
          const existingCourse = existingPlanForUpdate?.courses.find(
            (c) => c.courseId === courseId,
          );

          if (existingCourse) {
            return {
              courseId,
              isLocked: existingCourse.isLocked,
              sections: sections.map((s) => {
                const existingSection = existingCourse.sections.find(
                  (es) => es.sectionId === s.id,
                );
                return {
                  sectionId: s.id,
                  isHidden: existingSection?.isHidden ?? false,
                };
              }),
            };
          } else {
            return {
              courseId,
              sections: sections.map((s) => ({ sectionId: s.id })),
            };
          }
        });

        if (props.planId && (latestPlanData || initialExistingPlan)) {
          const response = await fetch(
            `/api/scheduler/saved-plans/${props.planId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courses, numCourses: numCoursesValue }),
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to update plan: ${response.statusText}`);
          }

          props.callback?.();
          props.closeFn();
        } else {
          const response = await fetch("/api/scheduler/saved-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              term: activeTerm.term + activeTerm.part,
              courses,
              numCourses: numCoursesValue,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create plan: ${response.statusText}`);
          }

          const plan = await response.json();
          router.push(`/scheduler/generator?planId=${plan.id}`);
          props.closeFn();
        }
      } catch (error) {
        console.error("Error saving plan:", error);
        alert("Failed to save plan. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [activeTerm, router, props, initialExistingPlan],
  );

  // Initialize modal with existing plan courses if updating
  // Only use initialExistingPlan to avoid reinitializing course selection during handleGenerateSchedules
  useEffect(() => {
    const courseIdsToLoad = initialExistingPlan
      ? initialExistingPlan.courses.map((c) => c.courseId)
      : [];

    if (!courseIdsToLoad.length) return;

    const syncInitialCourses = async () => {
      const rawResults = await Promise.all(
        courseIdsToLoad.map(fetchCourseById),
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
  }, [activeTerm, initialExistingPlan]);

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
