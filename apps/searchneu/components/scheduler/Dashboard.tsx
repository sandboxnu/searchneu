"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GroupedTerms } from "@/lib/types";
import { CollegeDropdown } from "@/components/scheduler/CollegeDropdown";
import { TermsDropdown } from "./TermsDropdown";


export function DashboardClient(props: {
  terms: Promise<GroupedTerms>;
}) {
  const [selectedCollege, setSelectedCollege] = useState<string>("neu");
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  return (
    <div className="bg-neu2 flex h-screen min-h-0 w-screen gap-3 px-4 pt-4 xl:px-6">
      <div className="bg-neu1 h-full min-h-0 w-full max-w-[280px] space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t-1">
        
        <h3 className="text-neu7 text-xs font-bold">SCHOOL</h3>
        <Suspense>
            <CollegeDropdown
                terms={props.terms}
                selectedCollege={selectedCollege}
                onCollegeChange={setSelectedCollege}
                onTermChange={setSelectedTerm}
            />
        </Suspense>
        

        <h3 className="text-neu7 text-xs font-bold">SEMESTER</h3>
        <Suspense>
            <TermsDropdown terms={props.terms} className="bg-secondary w-72" />
        </Suspense>
        
        <Button asChild className="mt-auto w-full">
          <Link href="/scheduler/generator">Open generator</Link>
        </Button>
      </div>

      <div className="bg-neu1 h-full min-h-0 w-full space-y-4 overflow-y-scroll rounded-lg border border-t-0 px-4 py-4 md:border-t-1">
      </div>
    </div>
  );
}