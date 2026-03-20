"use client";

import { Course, GroupedTerms, Section, Term } from "@/lib/catalog/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../ui/dialog";
import dynamic from "next/dynamic";
import { Button } from "../../../ui/button";
import { useCallback, useEffect, useState } from "react";
import { ModalSearchBar } from "./ModalSearchBar";
import SelectedCourseGroup from "./SelectedCourseGroup";
import { useRouter } from "next/navigation";

const ModalSearchResults = dynamic(() => import("./ModalSearchResults"), {
  ssr: false,
});

function stupidLittleHelper(c: Course) {
  return {
    subject: c.subjectCode,
    courseNumber: c.courseNumber,
  };
}

async function fetchCourseById(id: number): Promise<Course | null> {
  const res = await fetch(`/api/catalog/courses/${id}`);

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`failed to fetch course ${id}: ${res.status}`);
  }

  return (await res.json()) as Course;
}

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
      isCourseMatch(stupidLittleHelper(g.parent), course) ||
      g.coreqs.some((c) => isCourseMatch(stupidLittleHelper(c), course)),
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

interface ExistingPlanData {
  courses: Array<{
    courseId: number;
    isLocked: boolean;
    sections: Array<{
      sectionId: number;
      isHidden: boolean;
    }>;
  }>;
  numCourses?: number;
}

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

  const [numCourses, setNumCourses] = useState<number>(1);
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
          // Set numCourses from existing plan
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
  const activeTermLabel =
    Object.values(props.terms)
      .flat()
      .find((t) => t.term === activeTerm)?.name ?? "Selected Term";

  // helpers

  const fetchCoreqs = useCallback(
    async (course: Course, currentGroups: SelectedCourseGroupData[]) => {
      const allReqs = extractCoreqReqs(course.coreqs as CourseReq);
      const neededReqs = allReqs.filter(
        (req) => !isAlreadySelected(currentGroups, req),
      );

      const results = await Promise.all(
        neededReqs.map(async (req) => {
          const params = new URLSearchParams({
            term: activeTerm.term + activeTerm.part,
            subject: req.subject,
            courseNumber: req.courseNumber,
          });

          const res = await fetch(`/api/catalog/courses?${params.toString()}`);
          if (!res.ok) return null;

          return (await res.json()) as Course;
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

  // Fetch all sections for the selected courses
  const fetchSectionsForCourses = useCallback(
    async (courseIds: number[]): Promise<Map<number, Section[]>> => {
      const sectionsByCoursId = new Map<number, Section[]>();

      const results = await Promise.all(
        courseIds.map(async (courseId) => {
          try {
            const res = await fetch(
              `/api/catalog/courses/${courseId}/sections`,
            );
            if (res.ok) {
              const sections = (await res.json()) as Section[];
              return { courseId, sections };
            }
          } catch (error) {
            console.error(
              `Failed to fetch sections for course ${courseId}:`,
              error,
            );
          }
          return { courseId, sections: [] };
        }),
      );

      for (const { courseId, sections } of results) {
        sectionsByCoursId.set(courseId, sections);
      }

      return sectionsByCoursId;
    },
    [],
  );

  // Create plan or update existing plan
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
              {
                cache: "no-store",
              },
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

          // Check if this course exists in the latest plan data
          const existingCourse = existingPlanForUpdate?.courses.find(
            (c) => c.courseId === courseId,
          );

          if (existingCourse) {
            // Preserve lock status and section hidden status from existing plan
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
            // New course, use defaults
            return {
              courseId,
              sections: sections.map((s) => ({
                sectionId: s.id,
              })),
            };
          }
        });

        if (props.planId && (latestPlanData || initialExistingPlan)) {
          // Update existing plan
          const response = await fetch(
            `/api/scheduler/saved-plans/${props.planId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                courses,
                numCourses: numCoursesValue,
              }),
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to update plan: ${response.statusText}`);
          }

          props.callback?.();
          props.closeFn();
        } else {
          // Create new plan
          const response = await fetch("/api/scheduler/saved-plans", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              term: activeTerm.term,
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
    [activeTerm, fetchSectionsForCourses, router, props],
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
      for (const raw of fetchedCourses) {
        const course = raw;
        if (
          isAlreadySelected(newGroups, {
            subject: course.subjectCode,
            courseNumber: course.courseNumber,
          }) ||
          newGroups.length >= 10
        )
          continue;
        const coreqs = await fetchCoreqs(course, newGroups);
        newGroups.push({ parent: course, coreqs });
      }
      setSelectedCourseGroups(newGroups);
    };

    syncInitialCourses();
  }, [activeTerm, initialExistingPlan]);

  const handleSelectCourse = async (course: Course) => {
    if (
      isAlreadySelected(selectedCourseGroups, stupidLittleHelper(course)) ||
      selectedCourseGroups.length >= 10
    )
      return;

    const parentGroupIndex = selectedCourseGroups.findIndex((g) => {
      const parentCoreqReqs = extractCoreqReqs(g.parent.coreqs as CourseReq);
      return parentCoreqReqs.some((req) =>
        isCourseMatch(req, stupidLittleHelper(course)),
      );
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

  const handleDelete = (course: Course, isCoreq: boolean) => {
    setSelectedCourseGroups((prev) =>
      isCoreq
        ? prev.map((g) => ({
            ...g,
            coreqs: g.coreqs.filter(
              (c) =>
                !isCourseMatch(
                  stupidLittleHelper(c),
                  stupidLittleHelper(course),
                ),
            ),
          }))
        : prev.filter(
            (g) =>
              !isCourseMatch(
                stupidLittleHelper(g.parent),
                stupidLittleHelper(course),
              ),
          ),
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
            {searchQuery && (
              <ModalSearchResults
                searchQuery={searchQuery}
                term={activeTerm}
                onSelectCourse={handleSelectCourse}
              />
            )}
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
