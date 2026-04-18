"use client";

import { useMemo, useState } from "react";
import { Audit, Major } from "@/lib/graduate/types";
import { collectScheduleCourseKeys } from "@/lib/graduate/requirementUtils";
import { UNDECIDED_CONCENTRATION } from "@/lib/graduate/auditUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircularProgress } from "./CircularProgress";
import { RequirementSection } from "./RequirementSection";

export function MajorsTab({
  schedule,
  majors,
  concentration,
  creditsTaken,
  creditsTotal,
}: {
  schedule: Audit;
  majors: Major[];
  concentration: string | null;
  creditsTaken: number;
  creditsTotal: number;
}) {
  const [selectedMajorIdx, setSelectedMajorIdx] = useState(0);
  const currentMajor = majors[selectedMajorIdx] ?? null;
  const scheduleCourses = useMemo(
    () => collectScheduleCourseKeys(schedule),
    [schedule],
  );

  const subtitle =
    concentration === "Undecided" || concentration == null
      ? UNDECIDED_CONCENTRATION
      : concentration;
  const isUndecided = subtitle === UNDECIDED_CONCENTRATION;

  if (!currentMajor) {
    return (
      <div className="px-4 py-8 text-center">
        <span className="text-neu6 text-xs">No major selected</span>
      </div>
    );
  }

  return (
    <div>
      {/* Major selector + title */}
      <div className="px-4 pt-3 pb-2">
        {majors.length > 1 ? (
          <Select
            value={String(selectedMajorIdx)}
            onValueChange={(v) => setSelectedMajorIdx(Number(v))}
          >
            <SelectTrigger className="border-neu3 bg-neu1 mb-2 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {majors.map((m, i) => (
                <SelectItem key={i} value={String(i)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="border-neu3 bg-neu1 mb-2 flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-navy text-sm">{currentMajor.name}</span>
          </div>
        )}
        <h2 className="text-navy text-lg font-bold">{currentMajor.name}</h2>
        <p
          className={`text-sm ${isUndecided ? "text-red italic" : "text-neu6"}`}
        >
          {subtitle}
        </p>
      </div>

      <div className="px-4 pb-3">
        <CircularProgress current={creditsTaken} total={creditsTotal} />
      </div>

      {/* Requirement sections */}
      {currentMajor.requirementSections.map((section, index) => (
        <RequirementSection
          key={index}
          section={section}
          scheduleCourses={scheduleCourses}
          defaultOpen={index === 0}
        />
      ))}

      {currentMajor.requirementSections.length === 0 && (
        <p className="text-neu6 px-4 py-3 text-sm italic">
          No requirement sections
        </p>
      )}
    </div>
  );
}
