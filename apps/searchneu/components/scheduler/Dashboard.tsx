"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GroupedTerms } from "@/lib/types";
import { CollegeDropdown } from "@/components/scheduler/CollegeDropdown";
import { TermsDropdown } from "./TermsDropdown";
import { useRouter, useSearchParams } from "next/navigation";
import { Searchskie } from "../icons/Searchskie";
import AddCoursesModal from "./AddCoursesModal";

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

      <div className="bg-neu1 h-full min-h-0 w-full place-content-center space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t-1">
        <div className="flex flex-col items-center gap-1 text-center">
          <Searchskie className="w-72 pb-8" />
          <h1 className="text-xl font-semibold">No plans found</h1>
          <p className="">Generate a new schedule first</p>
        </div>
      </div>
    </div>
  );
}
