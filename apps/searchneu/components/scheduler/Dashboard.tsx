"use client";

import { useState, useEffect } from "react";
import type { GroupedTerms } from "@/lib/types";
import type { Plan } from "@/lib/scheduler/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MoveRightIcon } from "lucide-react";
import { PlanCard } from "./PlanCard";
import { CollegeDropdown } from "./CollegeDropdown";
import { TermsDropdown } from "./TermsDropdown";
import { Searchskie } from "../icons/Searchskie";

export function DashboardClient(props: {
  terms: Promise<GroupedTerms>;
}) {

  // Initialize local state which reads from URL 
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCollege, setSelectedCollege] = useState<string>(
    searchParams.get("college") ?? "neu"
  );

  const [selectedTerm, setSelectedTerm] = useState<string | null>(
    searchParams.get("term") ?? null
  );

  const [showPlans, setShowPlans] = useState(false);
  // TODO: Replace with saved plans from DB / user-synced API (e.g. getSavedPlans(userId))
  const [plans, setPlans] = useState<Plan[]>([{ id: "1", name: "plan 1" }]);
  const handleDeletePlan = (planId: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
  };

  useEffect(() => {
    if (showPlans && plans.length === 0) setShowPlans(false);
  }, [showPlans, plans.length]);

  // When selected college or term changed, the url is updated without page reloading (router.replace)
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

    router.replace(`/scheduler?${params.toString()}`, {scroll: false});
  }, [selectedCollege, selectedTerm, router]);

  return (
    <div className="bg-neu2 flex h-screen min-h-0 w-screen gap-3 px-4 pt-4 xl:px-6">
      <div className="bg-neu1 h-full min-h-0 w-full max-w-[280px] space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t">
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
        <Button asChild className="mt-auto w-full">
          <Link
            href={`/scheduler/generator?term=${selectedTerm}&college=${selectedCollege}`}
            className="flex items-center justify-center gap-2 font-bold"
          >
            <span className="font-semibold">Create a new plan</span>
            <MoveRightIcon className="size-5" />
          </Link>
        </Button>
        <Button variant="outline" className="w-full" onClick={() => setShowPlans((prev) => !prev)}>
          {showPlans ? "Hide plans" : "Display plans"}
        </Button>
      </div>

      <div className="flex h-full min-h-0 w-full flex-col gap-3 overflow-y-auto">
        {showPlans ? (
          <div className="flex w-full flex-col gap-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selectedCollege={selectedCollege}
                selectedTerm={selectedTerm}
                onDelete={handleDeletePlan}
              />
            ))}
          </div>
        ) : (
          <div className="bg-neu1 h-full min-h-0 w-full place-content-center space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t-1">
            <div className="flex flex-col items-center gap-1 text-center">
              <Searchskie className="w-72 pb-8" />
              <h1 className="text-xl font-semibold">No plans found</h1>
              <p className="">Generate a new schedule first</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}