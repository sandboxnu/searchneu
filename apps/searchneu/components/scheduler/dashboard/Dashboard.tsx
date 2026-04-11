"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Campus, Nupath, Term } from "@/lib/catalog/types";
import { GroupedTerms } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { use, useState } from "react";
import useSWR from "swr";
import { Searchskie } from "../../icons/Searchskie";
import AddCoursesModal from "../shared/modal/AddCoursesModal";
import { CollegeDropdown } from "./CollegeDropdown";
import { PlanCard } from "./PlanCard/PlanCard";
import { TermsDropdown } from "./TermsDropdown";

// Add type for plan
export type SavedPlan = {
  id: number;
  userId: string;
  term: string;
  name: string;
  startTime: number | null;
  endTime: number | null;
  freeDays: string[];
  includeHonorsSections: boolean;
  includeRemoteSections: boolean;
  hideFilledSections: boolean;
  campus: number | null;
  nupaths: number[];
  createdAt: Date;
  updatedAt: Date;
  courses: Array<{
    courseId: number;
    isLocked: boolean;
    courseSubject: string;
    courseNumber: string;
    courseName: string;
    sections: Array<{
      sectionId: number;
      isHidden: boolean;
    }>;
  }>;
  favoritedSchedules: Array<{
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    sections: Array<{
      sectionId: number;
      courseSubject: string;
      courseNumber: string;
      meetingTimes: Array<{
        id: number;
        sectionId: number;
        days: number[];
        startTime: number;
        endTime: number;
      }>;
    }>;
  }>;
};

export function DashboardClient({
  termsPromise,
  campusesPromise,
  nupathsPromise,
}: {
  termsPromise: Promise<GroupedTerms>;
  campusesPromise: Promise<Campus[]>;
  nupathsPromise: Promise<Nupath[]>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planIdToDelete, setPlanIdToDelete] = useState<number | null>(null);

  const [selectedCollege, setSelectedCollege] =
    useState<keyof GroupedTerms>("neu");

  const terms = use(termsPromise);
  const campuses = use(campusesPromise);
  const nupaths = use(nupathsPromise);

  const [selectedTerm, setSelectedTerm] = useState<Term>(terms.neu[0]);

  const {
    data: plans,
    isLoading,
    mutate,
  } = useSWR<SavedPlan[]>(
    // selectedTerm will always be defined
    `/api/scheduler/saved-plans/term/${selectedTerm.term}${selectedTerm.part}`,
    (u: string) => fetch(u).then((r) => r.json()),
    { fallbackData: [], suspense: true },
  );

  // this case should never happen as data is always defined (despite the type)
  if (!plans) throw Error("fallback data not correctly set");

  const handleDeletePlan = (planId: number) => {
    setPlanIdToDelete(planId);
  };

  const confirmDeletePlan = async () => {
    if (planIdToDelete == null) return;
    const planId = planIdToDelete;
    setPlanIdToDelete(null);

    mutate(
      async (p) => {
        if (!p) return;
        await fetch(`/api/scheduler/saved-plans/${planId}`, {
          method: "DELETE",
        });
        return p.filter((p) => p.id !== planId);
      },
      {
        revalidate: false,
        rollbackOnError: true,
        optimisticData: plans.filter((p) => p.id !== planId),
      },
    );
  };

  return (
    <div className="bg-neu2 flex h-screen min-h-0 w-screen gap-3 px-4 pt-4 xl:px-6">
      <Dialog
        open={planIdToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPlanIdToDelete(null);
        }}
      >
        <DialogContent className="p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">Delete Plan?</DialogTitle>
            <DialogDescription className="text-neu9">
              Are you sure you want to delete this plan? This action is
              permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="text-neu6 border-neu4 bg-neu2 cursor-pointer font-bold"
              onClick={() => setPlanIdToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-neu hover:bg-neu/90 text-neu1 cursor-pointer font-bold"
              onClick={confirmDeletePlan}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AddCoursesModal
        open={isModalOpen}
        terms={terms}
        selectedTerm={selectedTerm}
        closeFn={() => {
          setIsModalOpen(false);
        }}
      />
      <div className="bg-neu1 h-full min-h-0 w-full max-w-[280px] space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t-1">
        <h3 className="text-neu7 text-xs font-bold">SCHOOL</h3>
        <CollegeDropdown
          terms={terms}
          selectedCollege={selectedCollege}
          onCollegeChange={setSelectedCollege}
          onTermChange={setSelectedTerm}
        />

        <h3 className="text-neu7 text-xs font-bold">SEMESTER</h3>
        <TermsDropdown
          terms={terms}
          id="course-term-select"
          selectedCollege={selectedCollege}
          selectedTerm={selectedTerm}
          onTermChange={setSelectedTerm}
        />

        <Button
          className="mt-auto w-full cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          Create a Plan
        </Button>
      </div>

      <div
        className={cn(
          `bg-neu1 flex h-full min-h-0 w-full flex-col place-content-center space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t-1`,
          {
            "place-content-start": plans?.length > 0,
          },
        )}
      >
        {isLoading && (
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xl font-semibold">Loading plans...</p>
          </div>
        )}
        {!isLoading && plans.length === 0 && (
          <div className="flex flex-col items-center gap-1 text-center">
            <Searchskie className="w-72 pb-8" />
            <h1 className="text-xl font-semibold">No plans found</h1>
            <p className="">Generate a new schedule first</p>
          </div>
        )}
        {!isLoading && plans.length > 0 && (
          <div className="space-y-4 py-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDelete={handleDeletePlan}
                campuses={campuses}
                nupaths={nupaths}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
