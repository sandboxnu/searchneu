// ── YearRow ──────────────────────────────────────────────────────────────────

import { AuditCourse, AuditYear, Major, Minor, SeasonEnum } from "@/lib/graduate/types";
import { SEASON_DISPLAY } from "@/lib/graduate/auditUtils";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { AuditTermColumn } from "./AuditTermColumn";

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
  const credits = [year.fall, year.spring, year.summer1, year.summer2].reduce(
    (sum, t) => sum + t.classes.reduce((s, c) => s + c.numCreditsMin, 0),
    0,
  );

  return (
    <div className="flex flex-col">
      <div
        className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors duration-150 select-none ${expanded ? "bg-navy hover:bg-navy/80" : "bg-blue hover:bg-blue/90"}`}
        onClick={onToggle}
      >
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">Year {year.year}</span>
          <span className="text-sm text-white">
            {credits} {credits === 1 ? "Credit" : "Credits"} Completed
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="hover:text-red/60 p-1 text-white/70 transition-colors"
            title={`Delete Year ${year.year}`}
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(
                  `Delete Year ${year.year}? All courses in this year will be removed.`,
                )
              ) {
                onDeleteYear();
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-white" />
          ) : (
            <ChevronDown className="h-5 w-5 text-white" />
          )}
        </div>
      </div>

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
