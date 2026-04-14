"use client";

import {
  useState,
  useCallback,
  useEffect,
  useDeferredValue,
  useMemo,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModalSearchBar } from "../../scheduler/shared/modal/ModalSearchBar";
import {
  isAlreadySelected,
  extractCoreqReqs,
  sortGroups,
  isCourseMatch,
  fetchCoreqCourses,
} from "@/lib/scheduler/addCourseModal";
import { CourseSearchResult, GroupedTerms, Term } from "@/lib/catalog/types";
import {
  CourseReq,
  ModalCourse,
  SelectedCourseGroupData,
} from "@/lib/scheduler/types";
import {
  AuditCourse,
  IAndCourse,
  ICourseRange,
  IOrCourse,
  IRequiredCourse,
  IXofManyCourse,
  Major,
  Minor,
  NUPathEnum,
  Requirement,
  Section as GradSection,
} from "@/lib/graduate/types";
import { cn } from "@/lib/cn";
import { Trash2 } from "lucide-react";


const NUPATH_ENTRIES: { code: string; label: string }[] = Object.entries(
  NUPathEnum,
).map(([code, label]) => ({ code, label }));

interface AuditAddCoursesModalProps {
  open: boolean;
  termLabel: string;
  majors: Major[];
  minors: Minor[];
  onClose: () => void;
  onAddCourses: (courses: AuditCourse[]) => void;
}

type ExtendedModalCourse = ModalCourse & {
  minCredits?: string;
  maxCredits?: string;
  nupaths?: string[];
  prereqs?: unknown;
};


function extractCourseKeysFromSections(sections: GradSection[]): {
  exact: Set<string>;
  ranges: Array<{
    subject: string;
    min: number;
    max: number;
    exceptions: Set<string>;
  }>;
} {
  const exact = new Set<string>();
  const ranges: Array<{
    subject: string;
    min: number;
    max: number;
    exceptions: Set<string>;
  }> = [];

  function processReq(req: Requirement) {
    switch (req.type) {
      case "COURSE":
        exact.add(
          `${(req as IRequiredCourse).subject}-${(req as IRequiredCourse).classId}`,
        );
        break;
      case "RANGE": {
        const r = req as ICourseRange;
        ranges.push({
          subject: r.subject,
          min: r.idRangeStart,
          max: r.idRangeEnd,
          exceptions: new Set(
            r.exceptions.map((e) => `${e.subject}-${e.classId}`),
          ),
        });
        break;
      }
      case "SECTION":
        (req as GradSection).requirements.forEach(processReq);
        break;
      case "AND":
      case "OR":
      case "XOM":
        (req as IAndCourse | IOrCourse | IXofManyCourse).courses.forEach(
          processReq,
        );
        break;
    }
  }

  sections.forEach((s) => s.requirements.forEach(processReq));
  return { exact, ranges };
}

function courseMatchesFilter(
  course: CourseSearchResult,
  selectedNupaths: Set<string>,
  selectedMajorNames: Set<string>,
  selectedMinorNames: Set<string>,
  majors: Major[],
  minors: Minor[],
): boolean {
  if (
    selectedNupaths.size === 0 &&
    selectedMajorNames.size === 0 &&
    selectedMinorNames.size === 0
  )
    return true;

  if (
    selectedNupaths.size > 0 &&
    course.nupaths.some((n) => selectedNupaths.has(n))
  )
    return true;

  const courseNum = parseInt(course.courseNumber, 10);
  const key = `${course.subjectCode}-${courseNum}`;

  for (const major of majors) {
    if (!selectedMajorNames.has(major.name)) continue;
    const allSections = [
      ...major.requirementSections,
      ...(major.concentrations?.concentrationOptions ?? []),
    ];
    const { exact, ranges } = extractCourseKeysFromSections(allSections);
    if (exact.has(key)) return true;
    for (const range of ranges) {
      if (
        range.subject === course.subjectCode &&
        courseNum >= range.min &&
        courseNum <= range.max &&
        !range.exceptions.has(key)
      )
        return true;
    }
  }

  for (const minor of minors) {
    if (!selectedMinorNames.has(minor.name)) continue;
    const { exact, ranges } = extractCourseKeysFromSections(
      minor.requirementSections,
    );
    if (exact.has(key)) return true;
    for (const range of ranges) {
      if (
        range.subject === course.subjectCode &&
        courseNum >= range.min &&
        courseNum <= range.max &&
        !range.exceptions.has(key)
      )
        return true;
    }
  }

  return false;
}

/** Returns true if the coreq lives in an AND branch (required), false if OR (optional). */
function isCoreqRequired(parent: ModalCourse, coreq: ModalCourse): boolean {
  function check(req: CourseReq, inOr: boolean): boolean | null {
    if (req.subject && req.courseNumber) {
      if (
        req.subject === coreq.subjectCode &&
        req.courseNumber === coreq.courseNumber
      ) {
        return !inOr;
      }
      return null;
    }
    if (req.items && Array.isArray(req.items)) {
      const nextInOr = inOr || req.type === "OR";
      for (const item of req.items) {
        const result = check(item, nextInOr);
        if (result !== null) return result;
      }
    }
    return null;
  }
  if (!parent.coreqs) return true;
  return check(parent.coreqs as CourseReq, false) ?? true;
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function AuditAddCoursesModal({
  open,
  termLabel,
  majors,
  minors,
  onClose,
  onAddCourses,
}: AuditAddCoursesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseGroups, setSelectedCourseGroups] = useState<
    SelectedCourseGroupData[]
  >([]);
  const [mostRecentTerm, setMostRecentTerm] = useState<Term | null>(null);
  const [selectedNupaths, setSelectedNupaths] = useState<Set<string>>(
    new Set(),
  );
  const [selectedMajorNames, setSelectedMajorNames] = useState<Set<string>>(
    new Set(),
  );
  const [selectedMinorNames, setSelectedMinorNames] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!open || mostRecentTerm) return;
    fetch("/api/catalog/terms")
      .then((r) => r.json())
      .then((terms: GroupedTerms) => {
        const neuTerms = terms.neu;
        if (neuTerms.length === 0) return;
        setMostRecentTerm(neuTerms[0]);
      })
      .catch(console.error);
  }, [open, mostRecentTerm]);

  function handleClose() {
    setSearchQuery("");
    setSelectedCourseGroups([]);
    setSelectedNupaths(new Set());
    setSelectedMajorNames(new Set());
    setSelectedMinorNames(new Set());
    onClose();
  }

  const fetchCoreqs = useCallback(
    (course: ModalCourse, currentGroups: SelectedCourseGroupData[]) => {
      if (!mostRecentTerm) return Promise.resolve([]);
      return fetchCoreqCourses(course, currentGroups, mostRecentTerm);
    },
    [mostRecentTerm],
  );

  const handleSelectCourse = async (course: CourseSearchResult) => {
    if (
      isAlreadySelected(selectedCourseGroups, course) ||
      selectedCourseGroups.length >= 10
    )
      return;

    const parentGroupIndex = selectedCourseGroups.findIndex((g) => {
      const parentCoreqReqs = extractCoreqReqs(g.parent.coreqs as CourseReq);
      return parentCoreqReqs.some((req) => isCourseMatch(req, course));
    });

    if (parentGroupIndex !== -1) {
      setSelectedCourseGroups((prev) => {
        const next = [...prev];
        const groupToUpdate = next[parentGroupIndex];
        const updatedGroup = {
          ...groupToUpdate,
          coreqs: [...groupToUpdate.coreqs, course],
        };
        const sortedArray = sortGroups([updatedGroup]);
        next[parentGroupIndex] = sortedArray[0];
        return sortGroups(next);
      });
      return;
    }

    const validCoreqs = await fetchCoreqs(course, selectedCourseGroups);
    setSelectedCourseGroups((prev) =>
      sortGroups([...prev, { parent: course, coreqs: validCoreqs }]),
    );
  };

  const handleDelete = (course: ModalCourse, isCoreq: boolean) => {
    setSelectedCourseGroups((prev) =>
      isCoreq
        ? prev.map((g) => ({
            ...g,
            coreqs: g.coreqs.filter((c) => !isCourseMatch(c, course)),
          }))
        : prev.filter((g) => !isCourseMatch(g.parent, course)),
    );
  };

  function handleAddCourses() {
    const auditCourses: AuditCourse[] = selectedCourseGroups.flatMap((g) =>
      ([g.parent, ...g.coreqs] as ExtendedModalCourse[]).map((c) => ({
        name: c.name,
        classId: c.courseNumber,
        subject: c.subjectCode,
        prereqs: c.prereqs as AuditCourse["prereqs"],
        coreqs: c.coreqs as AuditCourse["coreqs"],
        nupaths: (c.nupaths ?? []) as NUPathEnum[],
        numCreditsMin: parseFloat(c.minCredits ?? "0") || 0,
        numCreditsMax: parseFloat(c.maxCredits ?? "0") || 0,
        id: null,
      })),
    );
    onAddCourses(auditCourses);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="flex h-[700px] w-9/10 flex-col items-start justify-start overflow-hidden px-6 py-9 md:max-w-[1050px] [&_[data-slot=dialog-close]]:cursor-pointer">
        <DialogHeader className="flex w-full items-center">
          <DialogTitle className="text-2xl font-bold">Add Courses</DialogTitle>
          <DialogDescription className="text-center">
            Select courses to add to{" "}
            <span className="font-bold">{termLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <hr className="h-[0.5px] w-full" />

        <div className="flex min-h-0 w-full flex-1 gap-4 overflow-hidden">
          {/* ── Filter Sidebar ── */}
          <div className="w-44 flex-shrink-0 overflow-y-auto pr-1">
            <div className="mb-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide">
                NUPATH
              </p>
              <div className="space-y-1">
                {NUPATH_ENTRIES.map(({ code, label }) => (
                  <label
                    key={code}
                    className="flex cursor-pointer items-start gap-1.5 py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNupaths.has(code)}
                      onChange={() =>
                        setSelectedNupaths((prev) => toggleInSet(prev, code))
                      }
                      className="accent-red mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-[11px] leading-snug">
                      <span className="font-bold">{code}</span>{" "}
                      <span className="text-neu6">{label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {majors.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide">
                  MAJOR(S)
                </p>
                <div className="space-y-1">
                  {majors.map((major) => (
                    <label
                      key={major.name}
                      className="flex cursor-pointer items-start gap-1.5 py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMajorNames.has(major.name)}
                        onChange={() =>
                          setSelectedMajorNames((prev) =>
                            toggleInSet(prev, major.name),
                          )
                        }
                        className="accent-red mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer"
                      />
                      <span className="text-neu6 text-[11px] leading-snug">
                        {major.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {minors.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide">
                  MINOR(S)
                </p>
                <div className="space-y-1">
                  {minors.map((minor) => (
                    <label
                      key={minor.name}
                      className="flex cursor-pointer items-start gap-1.5 py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMinorNames.has(minor.name)}
                        onChange={() =>
                          setSelectedMinorNames((prev) =>
                            toggleInSet(prev, minor.name),
                          )
                        }
                        className="accent-red mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer"
                      />
                      <span className="text-neu6 text-[11px] leading-snug">
                        {minor.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Search Pane ── */}
          <div className="flex w-[340px] flex-shrink-0 flex-col gap-3">
            <ModalSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            <p className="text-neu5 -mt-1 text-[11px] leading-snug">
              Can&apos;t find a course? Courses no longer offered
              can be dragged directly from the{" "}
              <span className="font-medium">Requirements</span> sidebar!
            </p>
            {mostRecentTerm && (
              <AuditSearchResults
                searchQuery={searchQuery}
                mostRecentTerm={mostRecentTerm}
                selectedNupaths={selectedNupaths}
                selectedMajorNames={selectedMajorNames}
                selectedMinorNames={selectedMinorNames}
                majors={majors}
                minors={minors}
                onSelectSearchResult={handleSelectCourse}
              />
            )}
          </div>

          {/* ── Added Courses Pane ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide">
              ADDED COURSES:
            </p>
            <div className="bg-neu25 min-h-0 flex-1 overflow-y-auto rounded-lg p-2">
              {selectedCourseGroups.length === 0 ? (
                <p className="text-neu5 p-2 text-xs">No courses added.</p>
              ) : (
                <div className="flex flex-col gap-y-2">
                  {selectedCourseGroups.map((group, i) => {
                    const parent = group.parent as ExtendedModalCourse;
                    return (
                      <div
                        key={`${group.parent.id}-${i}`}
                        className="bg-neu1 flex flex-col gap-2 rounded-lg px-3 py-2.5"
                      >
                        {/* Parent row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                              <span className="text-neu8 shrink-0 text-sm font-bold">
                                {parent.subjectCode} {parent.courseNumber}
                              </span>
                              <span className="text-neu6 text-sm leading-snug">
                                {parent.name}
                              </span>
                            </div>
                            {(parent.nupaths ?? []).length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(parent.nupaths ?? []).map((np) => (
                                  <span
                                    key={np}
                                    className="bg-neu3 text-neu7 rounded px-1.5 py-0.5 text-[10px] font-bold"
                                  >
                                    {np}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(parent, false)}
                            className="text-neu4 hover:text-red mt-0.5 flex-shrink-0 transition-colors"
                            title="Remove course"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Coreq rows  */}
                        {group.coreqs.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            {group.coreqs.map((coreq) => {
                              const required = isCoreqRequired(parent, coreq);
                              return (
                                <div
                                  key={
                                    coreq.id ??
                                    `${coreq.subjectCode}-${coreq.courseNumber}`
                                  }
                                  className="bg-neu25 flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="text-neu8 text-sm font-bold">
                                      {coreq.subjectCode} {coreq.courseNumber}
                                    </span>{" "}
                                    <span className="text-neu6 text-sm">
                                      {coreq.name}
                                    </span>
                                  </div>
                                  <div className="flex flex-shrink-0 items-center gap-1.5">
                                    <span
                                      className={cn(
                                        "text-[11px] font-medium",
                                        required ? "text-red" : "text-neu5",
                                      )}
                                    >
                                      {required ? "Required" : "Optional"}
                                    </span>
                                    {!required && (
                                      <button
                                        onClick={() => handleDelete(coreq, true)}
                                        className="text-neu4 hover:text-red transition-colors"
                                        title="Remove coreq"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              className="cursor-pointer"
              disabled={selectedCourseGroups.length === 0}
              onClick={handleAddCourses}
            >
              Add Courses
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuditSearchResults({
  searchQuery,
  mostRecentTerm,
  selectedNupaths,
  selectedMajorNames,
  selectedMinorNames,
  majors,
  minors,
  onSelectSearchResult,
}: {
  searchQuery: string;
  mostRecentTerm: Term;
  selectedNupaths: Set<string>;
  selectedMajorNames: Set<string>;
  selectedMinorNames: Set<string>;
  majors: Major[];
  minors: Minor[];
  onSelectSearchResult: (course: CourseSearchResult) => void;
}) {
  const [allResults, setAllResults] = useState<CourseSearchResult[] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    if (!deferredQuery) {
      setAllResults(null);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    const url = `/api/catalog/search?${new URLSearchParams({ q: deferredQuery, term: mostRecentTerm.term + mostRecentTerm.part })}`;

    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setAllResults(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setLoading(false);
      });

    return () => controller.abort();
  }, [deferredQuery, mostRecentTerm]);

  const filteredResults = useMemo(() => {
    if (!allResults) return null;
    return allResults.filter((course) =>
      courseMatchesFilter(
        course,
        selectedNupaths,
        selectedMajorNames,
        selectedMinorNames,
        majors,
        minors,
      ),
    );
  }, [
    allResults,
    selectedNupaths,
    selectedMajorNames,
    selectedMinorNames,
    majors,
    minors,
  ]);

  const stale = searchQuery !== deferredQuery || loading;

  if (!searchQuery) return null;

  if (loading && !allResults) {
    return (
      <div className="flex-1 space-y-2 overflow-hidden p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-neu3 flex w-full animate-pulse items-center justify-between rounded-lg px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-1">
              <div className="bg-neu4 h-3.5 w-10 rounded" />
              <div className="bg-neu4 h-3.5 flex-1 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filteredResults) return null;

  const displayResults = filteredResults.slice(0, 20);

  if (displayResults.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-neu6 text-sm">No Results</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-neu25 min-h-0 flex-1 overflow-y-auto rounded-lg border",
        stale && "opacity-60",
      )}
    >
      {displayResults.map((course) => {
        const coreqRefs = extractCoreqReqs(course.coreqs as CourseReq);
        return (
          <div
            key={`${course.subjectCode}-${course.courseNumber}`}
            onClick={() => onSelectSearchResult(course)}
            className="hover:bg-neu2 bg-neu1 border-neu3 w-full cursor-pointer px-4 py-2 text-[14px] transition-colors last:border-0"
          >
            <p className="flex min-w-0 items-center gap-1">
              <span className="text-neu8 shrink-0 font-bold">
                {course.subjectCode} {course.courseNumber}
              </span>
              <span className="text-neu6 truncate">{course.name}</span>
            </p>
            {coreqRefs.map((ref) => (
              <p
                key={`${ref.subjectCode}-${ref.courseNumber}`}
                className="text-neu5 mt-0.5 flex items-center gap-1 text-xs"
              >
                <span className="font-medium">+</span>
                <span>
                  {ref.subjectCode} {ref.courseNumber}
                </span>
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}
