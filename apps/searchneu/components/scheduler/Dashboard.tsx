"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GroupedTerms } from "@/lib/types";
import { CollegeDropdown } from "@/components/scheduler/CollegeDropdown";
import { TermsDropdown } from "./TermsDropdown";
import { useRouter, useSearchParams } from "next/navigation";
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
        
        <Button asChild className="mt-auto w-full">
          <Link href={`/scheduler/generator?term=${selectedTerm}&college=${selectedCollege}`}>
          Open generator
          </Link>
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