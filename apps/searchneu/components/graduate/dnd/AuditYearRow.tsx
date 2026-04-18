// ── YearRow ──────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  AuditCourse,
  AuditYear,
  Major,
  Minor,
  SeasonEnum,
} from "@/lib/graduate/types";
import { SEASON_DISPLAY } from "@/lib/graduate/auditUtils";
import { AuditTermColumn } from "./AuditTermColumn";
import { DeleteIcon } from "@/components/icons/Delete";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function AuditYearRow({
  year,
  expanded,
  majors,
  minors,
  onToggle,
  onRemoveCourse,
  onDeleteYear,
  onAddCourses,
}: {
  year: AuditYear;
  expanded: boolean;
  majors: Major[];
  minors: Minor[];
  onToggle: () => void;
  onRemoveCourse: (season: SeasonEnum, courseIndex: number) => void;
  onDeleteYear: () => void;
  onAddCourses: (season: SeasonEnum, courses: AuditCourse[]) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const credits = [year.fall, year.spring, year.summer1, year.summer2].reduce(
    (sum, t) => sum + t.classes.reduce((s, c) => s + c.numCreditsMin, 0),
    0,
  );

  return (
    <div className="border-neu3 flex flex-col rounded-[8px] border-1 bg-white px-[24px] py-[16px]">
      <div
        className={`flex cursor-pointer items-center justify-between rounded-[10px] bg-white transition-colors duration-150 select-none`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-neu8 text-[16px] font-bold">
            Year {year.year}
          </span>
          <span className="text-neu6 bg-neu2 rounded-[8px] px-[8px] py-[4px] text-[12px]">
            {credits} {credits === 1 ? "credit" : "credits"} complete
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="border-neu3 bg-neu2 text-neu4 cursor-pointer rounded-[24px] border-1 p-[8px] transition-colors"
            title={`Delete Year ${year.year}`}
            onClick={(e) => {
              e.stopPropagation();
              setConfirmOpen(true);
            }}
          >
            <DeleteIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Year {year.year}?</AlertDialogTitle>
          <AlertDialogDescription>
            All courses in this year will be removed.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onDeleteYear();
                setConfirmOpen(false);
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {expanded && (
        <div className="grid min-h-[220px] grid-cols-4">
          {(
            [
              { term: year.fall, season: SeasonEnum.FL },
              { term: year.spring, season: SeasonEnum.SP },
              { term: year.summer1, season: SeasonEnum.S1 },
              { term: year.summer2, season: SeasonEnum.S2 },
            ] as const
          ).map(({ term, season }) => (
            <AuditTermColumn
              key={term.id}
              term={term}
              termLabel={`Year ${year.year} ${SEASON_DISPLAY[season]}`}
              majors={majors}
              minors={minors}
              onRemoveCourse={(i) => onRemoveCourse(season, i)}
              onAddCourses={(courses) => onAddCourses(season, courses)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
