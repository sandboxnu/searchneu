"use client";

import { useMemo, useState } from "react";
import { Audit, Major } from "@/lib/graduate/types";
import { collectScheduleCourseCredits } from "@/lib/graduate/requirementUtils";
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
    () => collectScheduleCourseCredits(schedule),
    [schedule],
  );

  const subtitle =
    concentration === "Undecided" || concentration == null
      ? UNDECIDED_CONCENTRATION
      : concentration;
  const isUndecided = subtitle === UNDECIDED_CONCENTRATION;

  if (!currentMajor) {
    return (
      <div className="py-8 text-center">
        <span className="text-neu6 text-xs">No major selected</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Major selector + title */}
      <div>
        {majors.length > 1 ? (
          <Select
            value={String(selectedMajorIdx)}
            // maps indexes to names so the trigger shows the name before the popup opens
            items={majors.map((m, i) => ({ value: String(i), label: m.name }))}
            onValueChange={(v) => setSelectedMajorIdx(Number(v))}
          >
            <SelectTrigger className="border-neu2 bg-neu1 text-neu8 mb-2 w-full font-bold">
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
          <div className="border-neu2 bg-neu1 mb-2 flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-neu8 text-sm font-bold">
              {currentMajor.name}
            </span>
          </div>
        )}
        <h2 className="text-neu8 text-lg font-bold">{currentMajor.name}</h2>
        <p
          className={`text-sm ${isUndecided ? "text-red italic" : "text-neu6"}`}
        >
          {subtitle}
        </p>
      </div>

      <div>
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
        <p className="text-neu6 text-sm italic">No requirement sections</p>
      )}
    </div>
  );
}
