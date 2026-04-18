"use client";

import { useMemo, useState } from "react";
import { Audit, Minor } from "@/lib/graduate/types";
import { collectScheduleCourseKeys } from "@/lib/graduate/requirementUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircularProgress } from "./CircularProgress";
import { RequirementSection } from "./RequirementSection";

export function MinorsTab({
  schedule,
  minors,
  creditsTaken,
  creditsTotal,
}: {
  schedule: Audit;
  minors: Minor[];
  creditsTaken: number;
  creditsTotal: number;
}) {
  const [selectedMinorIdx, setSelectedMinorIdx] = useState(0);
  const currentMinor = minors[selectedMinorIdx] ?? null;
  const scheduleCourses = useMemo(
    () => collectScheduleCourseKeys(schedule),
    [schedule],
  );

  if (!currentMinor) {
    return (
      <div className="px-4 py-8 text-center">
        <span className="text-neu6 text-xs">No minor selected</span>
      </div>
    );
  }

  return (
    <div>
      {/* Minor selector + title */}
      <div className="px-4 pt-3 pb-2">
        {minors.length > 1 ? (
          <Select
            value={String(selectedMinorIdx)}
            onValueChange={(v) => setSelectedMinorIdx(Number(v))}
          >
            <SelectTrigger className="border-neu3 bg-neu1 mb-2 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {minors.map((m, i) => (
                <SelectItem key={i} value={String(i)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="border-neu3 bg-neu1 mb-2 flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-navy text-sm">{currentMinor.name}</span>
          </div>
        )}
        <h2 className="text-navy text-lg font-bold">{currentMinor.name}</h2>
        <p className="text-neu6 text-sm">Minor Requirements</p>
      </div>

      <div className="px-4 pb-3">
        <CircularProgress current={creditsTaken} total={creditsTotal} />
      </div>

      {/* Requirement sections */}
      {currentMinor.requirementSections.map((section, index) => (
        <RequirementSection
          key={index}
          section={section}
          scheduleCourses={scheduleCourses}
          defaultOpen={index === 0}
        />
      ))}

      {currentMinor.requirementSections.length === 0 && (
        <p className="text-neu6 px-4 py-3 text-sm italic">
          No requirement sections
        </p>
      )}
    </div>
  );
}
