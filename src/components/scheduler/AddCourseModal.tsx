"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface Course {
  id: number;
  code: string;
  name: string;
}

interface SearchResult {
  id: number;
  name: string;
  subject: string;
  courseNumber: string;
  campus: string[];
  [key: string]: unknown;
}

interface SelectedCourse {
  id?: number;
  code: string;
  name: string;
  children: Course[];
  isLocked?: boolean;
}

interface AddCoursesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term?: string;
  onGenerateSchedules?: (courseIds: number[]) => void;
}

export function AddCoursesModal({
  open,
  onOpenChange,
  term = "Spring 2026",
  onGenerateSchedules,
}: AddCoursesModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([]);
  const [campus, setCampus] = useState("Boston Campus");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termDisplayName, setTermDisplayName] = useState<string | null>(null);

  // Debounced search query - use useEffect with timeout for debouncing
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch term display name
  useEffect(() => {
    const fetchTermName = async () => {
      if (!term) {
        setTermDisplayName(null);
        return;
      }

      try {
        const response = await fetch("/api/terms");
        if (!response.ok) {
          console.warn("Failed to fetch terms for display name");
          setTermDisplayName(term); // Fallback to term ID
          return;
        }

        const groupedTerms: {
          neu: Array<{ term: string; name: string }>;
          cps: Array<{ term: string; name: string }>;
          law: Array<{ term: string; name: string }>;
        } = await response.json();

        // Search through all term groups to find matching term
        const allTerms = [
          ...groupedTerms.neu,
          ...groupedTerms.cps,
          ...groupedTerms.law,
        ];

        const foundTerm = allTerms.find((t) => t.term === term);
        setTermDisplayName(foundTerm?.name || term);
      } catch (err) {
        console.warn("Error fetching term name:", err);
        setTermDisplayName(term); // Fallback to term ID
      }
    };

    fetchTermName();
  }, [term]);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      // Don't fetch if no term is provided
      if (!term) {
        setCourses([]);
        setIsLoading(false);
        setError("Term is required");
        return;
      }

      // Skip search if query is less than 4 characters (API requirement)
      if (debouncedSearchQuery.length > 0 && debouncedSearchQuery.length < 4) {
        setCourses([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("term", term);
        if (debouncedSearchQuery) {
          params.set("q", debouncedSearchQuery);
        }
        // TODO: Add campus filter when campus filtering is implemented
        // if (campus && campus !== "Boston Campus") {
        //   params.append("camp", campus);
        // }

        const response = await fetch(`/api/search?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.statusText}`);
        }

        const data: SearchResult[] | { error: string } = await response.json();

        if ("error" in data) {
          setError(data.error);
          setCourses([]);
          return;
        }

        // Transform API response to Course format
        const transformedCourses: Course[] = data.map((result) => ({
          id: result.id,
          code: `${result.subject} ${result.courseNumber}`,
          name: result.name,
        }));

        // Remove duplicates based on course code
        const uniqueCourses = Array.from(
          new Map(
            transformedCourses.map((course) => [course.code, course]),
          ).values(),
        );

        setCourses(uniqueCourses);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch courses",
        );
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [debouncedSearchQuery, term, campus]);

  // Filter courses based on search (already done by API, but we can add client-side filtering if needed)
  const filteredCourses = courses;

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
          isLocked: false,
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
    const courseIds = selectedCourses
      .map((course) => course.id)
      .filter((id): id is number => id !== undefined);

    if (courseIds.length === 0) {
      console.warn(
        "No course IDs available. Selected courses:",
        selectedCourses,
      );
      alert("Unable to generate schedules: course IDs are missing.");
      return;
    }

    if (onGenerateSchedules) {
      onGenerateSchedules(courseIds);
    } else {
      router.push(`/scheduler?courseIds=${courseIds.join(",")}`);
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
              <span className="text-foreground font-medium">
                {termDisplayName || term}
              </span>
              .
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
            <div className="border-border max-h-72 space-y-1 overflow-y-auto rounded-lg border">
              {isLoading ? (
                <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-sm">
                  Loading courses...
                </div>
              ) : error ? (
                <div className="text-muted-foreground flex h-full flex-col items-center justify-center py-12 text-sm">
                  <p className="text-destructive">Error: {error}</p>
                </div>
              ) : searchQuery.length > 0 && searchQuery.length < 4 ? (
                <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-sm">
                  Type at least 4 characters to search
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-sm">
                  {searchQuery
                    ? "No courses found"
                    : "Start typing to search for courses"}
                </div>
              ) : (
                filteredCourses.map((course) => (
                  <button
                    key={course.code}
                    onClick={() => handleCourseSelect(course)}
                    className={cn(
                      "hover:bg-muted/50 flex w-full items-baseline gap-2 px-4 py-2.5 text-left transition-colors",
                      isSelected(course.code) && "bg-muted/30",
                    )}
                  >
                    <span className="text-foreground text-sm font-medium">
                      {course.code}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {course.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column - Selected Courses - Now uses state instead of static data */}
          <div className="border-border max-h-96 overflow-y-auto rounded-lg border">
            {selectedCourses.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-sm">
                No courses selected
              </div>
            ) : (
              selectedCourses.map((course, index) => (
                <div key={course.code + index}>
                  {/* Parent Course */}
                  <div className="group hover:bg-muted/50 flex items-center gap-2 px-4 py-2.5 transition-colors">
                    <button
                      onClick={() => handleToggleLock(course.code)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {course.isLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <LockOpen className="h-4 w-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <span className="text-foreground text-sm font-medium">
                        {course.code}
                      </span>
                      <span className="text-muted-foreground ml-2 truncate text-sm">
                        {course.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1">
                        <Info className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(course.code)}
                        className="text-muted-foreground hover:bg-muted hover:text-destructive rounded p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Child Courses (Recitations/Labs) */}
                  {course.children.map((child) => (
                    <div
                      key={child.code}
                      className="hover:bg-muted/50 flex items-center gap-2 py-2.5 pr-4 pl-10 transition-colors"
                    >
                      <span className="text-muted-foreground text-sm font-medium">
                        {child.code}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {child.name}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer - Button now calls handler and is disabled when no selection */}
        <div className="p-6 pt-2">
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
  );
}
