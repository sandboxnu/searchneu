"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GroupedTerms } from "@/lib/types";
import { CollegeDropdown } from "@/components/scheduler/CollegeDropdown";
import { TermsDropdown } from "./TermsDropdown";
import { useRouter, useSearchParams } from "next/navigation";
import { Searchskie } from "../icons/Searchskie";
import AddCoursesModal from "./AddCoursesModal";
import { PlanCard } from "./PlanCard";

// Add type for plan
type SavedPlan = {
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
  campuses: number | null;
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

export function DashboardClient(props: { terms: GroupedTerms }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedCollege, setSelectedCollege] = useState<string>(
    searchParams.get("college") ?? "neu",
  );

  const [selectedTerm, setSelectedTerm] = useState<string | null>(
    searchParams.get("term") ?? null,
  );

  // NEW: Add state for plans and loading
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // NEW: Fetch plans when term changes
  useEffect(() => {
    const fetchPlans = async () => {
      if (!selectedTerm) {
        setPlans([]);
        return;
      }

      setIsLoadingPlans(true);
      try {
        const response = await fetch(
          `/api/scheduler/saved-plans/term/${selectedTerm}`,
        );
        
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        } else {
          console.error("Failed to fetch plans:", response.statusText);
          setPlans([]);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
        setPlans([]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [selectedTerm]);

  // NEW: Delete plan handler with confirmation
  const handleDeletePlan = async (planId: number) => {
    if (!confirm("Are you sure you want to delete this plan?")) {
      return;
    }

    try {
      const response = await fetch(`/api/scheduler/saved-plans/${planId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Refresh the plans list
        if (selectedTerm) {
          const refreshResponse = await fetch(
            `/api/scheduler/saved-plans/term/${selectedTerm}`,
          );
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setPlans(data);
          }
        }
      } else {
        console.error("Failed to delete plan");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  const handleGenerateSchedules = (
    lockedCourseIds: number[],
    optionalCourseIds: number[],
    numCourses?: number,
  ) => {
    const params = new URLSearchParams();
    if (lockedCourseIds.length > 0) {
      params.set("lockedCourseIds", lockedCourseIds.join(","));
    }
    if (optionalCourseIds.length > 0) {
      params.set("optionalCourseIds", optionalCourseIds.join(","));
    }
    if (numCourses !== undefined) {
      params.set("numCourses", numCourses.toString());
    }
    router.push(`/scheduler/generator?${params.toString()}`);
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedCollege) {
      params.set("college", selectedCollege);
    }

    if (selectedTerm) {
      params.set("term", selectedTerm);
    } else {
      params.delete("term");
    }

    router.replace(`/scheduler?${params.toString()}`, { scroll: false });
  }, [selectedCollege, selectedTerm, router]);

  return (
    <div className="bg-neu2 flex h-screen min-h-0 w-screen gap-3 px-4 pt-4 xl:px-6">
      <AddCoursesModal
        open={isModalOpen}
        terms={props.terms}
        selectedTerm={selectedTerm}
        onGenerateSchedules={handleGenerateSchedules}
        closeFn={() => {
          setIsModalOpen(false);
        }}
      />
      <div className="bg-neu1 h-full min-h-0 w-full max-w-[280px] space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t-1">
        <h3 className="text-neu7 text-xs font-bold">SCHOOL</h3>

        <CollegeDropdown
          terms={props.terms}
          selectedCollege={selectedCollege}
          onCollegeChange={setSelectedCollege}
          onTermChange={setSelectedTerm}
        />

        <h3 className="text-neu7 text-xs font-bold">SEMESTER</h3>

        <TermsDropdown
          terms={props.terms}
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

      {/* CHANGED: Replace empty state with conditional rendering */}
      <div className="bg-neu1 h-full min-h-0 w-full place-content-center space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t-1">
        {!selectedTerm ? (
          <div className="flex flex-col items-center gap-1 text-center">
            <Searchskie className="w-72 pb-8" />
            <h1 className="text-xl font-semibold">Select a term to view plans</h1>
          </div>
        ) : isLoadingPlans ? (
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xl font-semibold">Loading plans...</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center gap-1 text-center">
            <Searchskie className="w-72 pb-8" />
            <h1 className="text-xl font-semibold">No plans found</h1>
            <p className="">Generate a new schedule first</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onDelete={handleDeletePlan}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}