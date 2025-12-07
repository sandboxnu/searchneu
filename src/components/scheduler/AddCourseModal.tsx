"use client";

import { useState, useDeferredValue, Suspense, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  X,
  Search,
  Lock,
  LockOpen,
  Info,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { CourseSearchResult } from "@/lib/types";

interface Course {
  id: number;
  code: string;
  name: string;
}

interface SelectedCourse {
  id?: number;
  code: string;
  name: string;
  children: Course[];
  isLocked?: boolean;
}

// this acts as a single value cache for the data fetcher - the fetch promise has to be stored outside
// the react tree since otherwise they would be recreated on every rerender
let cacheKey = "!";
let cachePromise: Promise<unknown> = new Promise((r) => r([]));

function fetcher<T>(key: string, p: () => string) {
  if (!Object.is(cacheKey, key)) {
    cacheKey = key;
    // if window is undefined, then we are ssr and thus cannot do a relative fetch
    if (typeof window !== "undefined") {
      // PERF: next caching on the fetch
      cachePromise = fetch(p()).then((r) => r.json());
    }
  }

  return cachePromise as Promise<T>;
}

export function AddCoursesModal({
  open,
  onOpenChange,
  term = "Spring 2026",
  termName = "Spring 2026",
  onGenerateSchedules,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term?: string;
  termName?: string;
  onGenerateSchedules?: (lockedCourseIds: number[], optionalCourseIds: number[]) => void;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [campus, setCampus] = useState("Boston Campus");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isStale = deferredSearchQuery !== searchQuery;

  const handleCourseSelect = (course: Course) => {
    if (isSelected(course.code)) {
      setSelectedCourses((prev) => prev.filter((c) => c.code !== course.code));
    } else if (selectedCourses.length < 10) {
      setSelectedCourses((prev) => [
        ...prev,
        {
          id: course.id,
          code: course.code,
          name: course.name,
          children: [],
          isLocked: true,
        },
      ]);
    }
  };

  const handleToggleLock = (courseCode: string) => {
    setSelectedCourses((prev) =>
      prev.map((course) =>
        course.code === courseCode
          ? { ...course, isLocked: !course.isLocked }
          : course,
      ),
    );
  };

  const handleRemove = (courseCode: string) => {
    setSelectedCourses((prev) => prev.filter((c) => c.code !== courseCode));
  };

  const handleGenerateSchedules = () => {
    const lockedCourseIds = selectedCourses
      .filter((course) => course.isLocked)
      .map((course) => course.id)
      .filter((id): id is number => id !== undefined);

    const unlockedCourseIds = selectedCourses
      .filter((course) => !course.isLocked)
      .map((course) => course.id)
      .filter((id): id is number => id !== undefined);

    if (lockedCourseIds.length === 0 && unlockedCourseIds.length === 0) {
      console.warn(
        "No course IDs available. Selected courses:",
        selectedCourses,
      );
      alert("Unable to generate schedules: course IDs are missing.");
      return;
    }

    if (onGenerateSchedules) {
      onGenerateSchedules(lockedCourseIds, unlockedCourseIds);
    } else {
      const params = new URLSearchParams();
      if (lockedCourseIds.length > 0) {
        params.set("lockedCourseIds", lockedCourseIds.join(","));
      }
      if (unlockedCourseIds.length > 0) {
        params.set("optionalCourseIds", unlockedCourseIds.join(","));
      }
      router.push(`/scheduler?${params.toString()}`);
    }

    onOpenChange(false);
  };

  const isSelected = (courseCode: string): boolean => {
    return selectedCourses.some((course) => course.code === courseCode);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background relative w-full max-w-3xl rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-2">
          <div className="flex-1 text-center">
            <h2 className="text-foreground text-2xl font-semibold">
              Add Courses
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Add up to 10 courses that you are considering for{" "}
              <span className="text-foreground font-medium">{termName}</span>.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-4 right-4 rounded-sm p-1 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-4 p-6 pt-4">
          {/* Left Column - Search */}
          <div className="flex flex-col gap-3">
            {/* Campus Dropdown */}
            <button className="border-border bg-background hover:bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-2.5 text-left transition-colors">
              <span className="text-primary text-sm font-medium">{campus}</span>
              <ChevronDown className="text-primary h-4 w-4" />
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by course number or course name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Course List - Added click handler and selection styling */}
            <div
              className={cn(
                "border-border rounded-lg border transition-opacity",
                isStale && "opacity-60",
              )}
            >
              <Suspense fallback={<CourseListSkeleton />}>
                <CourseList
                  searchQuery={deferredSearchQuery}
                  term={term || ""}
                  campus={campus}
                  selectedCourses={selectedCourses}
                  onCourseSelect={handleCourseSelect}
                  isSelected={isSelected}
                />
              </Suspense>
            </div>
          </div>

          {/* Right Column - Selected Courses - Now uses state instead of static data */}
          <div className="flex flex-col gap-3">
            <div className="border-border max-h-96 overflow-y-auto rounded-lg border bg-muted/20 p-2">
              {selectedCourses.length === 0 ? (
                <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-sm">
                  No courses selected
                </div>
              ) : (
                selectedCourses.map((course, index) => (
                  <div
                    key={course.code + index}
                    className="group mb-2 flex flex-col rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md"
                  >
                    {/* Parent Course */}
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => handleToggleLock(course.code)}
                        className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 transition-colors"
                        title={course.isLocked ? "Unlock course" : "Lock course"}
                      >
                        {course.isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <LockOpen className="h-4 w-4" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-foreground text-sm font-bold">
                            {course.code}
                          </span>
                          {course.isLocked && (
                            <span className="text-muted-foreground text-xs">
                              Locked
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-left text-sm leading-tight">
                          {course.name}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1.5 transition-colors"
                          title="Course info"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRemove(course.code)}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded p-1.5 transition-colors"
                          title="Remove course"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Child Courses (Recitations/Labs) */}
                    {course.children.length > 0 && (
                      <div className="mt-2 space-y-1 border-t pt-2">
                        {course.children.map((child) => (
                          <div
                            key={child.code}
                            className="bg-muted/30 flex items-center gap-2 rounded px-2 py-1.5"
                          >
                            <span className="text-foreground text-xs font-medium">
                              {child.code}
                            </span>
                            <span className="text-muted-foreground truncate text-xs">
                              {child.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Generate Schedules Button */}
            <Button
              className="w-full"
              onClick={handleGenerateSchedules}
              disabled={selectedCourses.length === 0}
            >
              Generate Schedules
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseList({
  searchQuery,
  term,
  campus,
  selectedCourses,
  onCourseSelect,
  isSelected,
}: {
  searchQuery: string;
  term: string;
  campus: string;
  selectedCourses: SelectedCourse[];
  onCourseSelect: (course: Course) => void;
  isSelected: (courseCode: string) => boolean;
}) {
  // Handle empty states before using hooks
  if (!searchQuery) {
    return (
      <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
        Start typing to search for courses
      </div>
    );
  }

  if (searchQuery.length > 0 && searchQuery.length < 4) {
    return (
      <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
        Type at least 4 characters to search
      </div>
    );
  }

  return (
    <CourseListContent
      searchQuery={searchQuery}
      term={term}
      campus={campus}
      selectedCourses={selectedCourses}
      onCourseSelect={onCourseSelect}
      isSelected={isSelected}
    />
  );
}

function CourseListContent({
  searchQuery,
  term,
  campus,
  selectedCourses,
  onCourseSelect,
  isSelected,
}: {
  searchQuery: string;
  term: string;
  campus: string;
  selectedCourses: SelectedCourse[];
  onCourseSelect: (course: Course) => void;
  isSelected: (courseCode: string) => boolean;
}) {
  const results = use(
    fetcher<CourseSearchResult[] | { error: string }>(
      searchQuery + term + campus,
      () => {
        const params = new URLSearchParams();
        params.set("term", term);
        params.set("q", searchQuery);
        // TODO: Add campus filter when campus filtering is implemented
        // if (campus && campus !== "Boston Campus") {
        //   params.append("camp", campus);
        // }
        return `/api/search?${params.toString()}`;
      },
    ),
  );

  if (!Array.isArray(results)) {
    if (results.error === "insufficient query length") {
      return (
        <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
          Type at least 4 characters to search
        </div>
      );
    }

    return (
      <div className="text-muted-foreground flex h-72 flex-col items-center justify-center text-sm">
        <p className="text-destructive">Error: {results.error}</p>
      </div>
    );
  }

  // Transform API response to Course format
  const courses: Course[] = results.map((result) => ({
    id: result.id,
    code: `${result.subject} ${result.courseNumber}`,
    name: result.name,
  }));

  if (courses.length === 0) {
    return (
      <div className="text-muted-foreground flex h-72 items-center justify-center text-sm">
        No courses found
      </div>
    );
  }

  const parentRef = useRef(null);

  const virtual = useVirtualizer({
    count: courses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Approximate height of each course item
    scrollPaddingStart: 8,
    overscan: 5,
  });

  const items = virtual.getVirtualItems();

  return (
    <div ref={parentRef} className="h-72 w-full overflow-y-auto p-2">
      <div className="relative" style={{ height: virtual.getTotalSize() }}>
        <div
          className="absolute top-0 left-0 w-full"
          style={{
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((virtualItem) => {
            const course = courses[virtualItem.index];
            const selected = isSelected(course.code);
            return (
              <button
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtual.measureElement}
                onClick={() => onCourseSelect(course)}
                className={cn(
                  "mb-2 flex w-full flex-col rounded-lg border bg-white p-3 text-left shadow-sm transition-all",
                  "hover:shadow-md hover:border-primary/50",
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border",
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-foreground text-sm font-bold">
                    {course.code}
                  </span>
                  {selected && (
                    <span className="text-primary text-xs font-medium">
                      Selected
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground mt-0.5 text-sm">
                  {course.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CourseListSkeleton() {
  return (
    <div className="h-72 space-y-2 overflow-y-clip p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-14 w-full animate-pulse rounded-lg border bg-white p-3"
        >
          <div className="bg-muted mb-1.5 h-4 w-24 rounded"></div>
          <div className="bg-muted h-3 w-full rounded"></div>
        </div>
      ))}
    </div>
  );
}
