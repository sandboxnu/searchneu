"use client";

import { ReactNode, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SavedPlan } from "./Dashboard";
import { Pencil, Trash2, MapPin, Clock, Lock, Star } from "lucide-react";
import {
  COURSE_COLORS,
  type CourseColor,
  getCourseColorMap,
} from "@/lib/scheduler/courseColors";
import { MiniCalendar } from "./MiniCalendar";
import type { SectionWithCourse } from "@/lib/scheduler/filters";

interface PlanCardProps {
  plan: SavedPlan;
  onDelete: (planId: number) => void;
}

export function PlanCard({ plan, onDelete }: PlanCardProps) {
  const router = useRouter();

  const handleEdit = () => {
    const params = new URLSearchParams();
    params.set("term", plan.term);

    const lockedCourseIds: number[] = [];
    const optionalCourseIds: number[] = [];
    const hiddenSections: string[] = [];

    plan.courses.forEach((course) => {
      if (course.isLocked) {
        lockedCourseIds.push(course.courseId);
      } else {
        optionalCourseIds.push(course.courseId);
      }
      course.sections.forEach((section) => {
        if (section.isHidden) {
          hiddenSections.push(section.sectionId.toString());
        }
      });
    });

    if (lockedCourseIds.length > 0) {
      params.set("lockedCourseIds", lockedCourseIds.join(","));
    }
    if (optionalCourseIds.length > 0) {
      params.set("optionalCourseIds", optionalCourseIds.join(","));
    }
    if (plan.startTime !== null) {
      params.set("startTime", plan.startTime.toString());
    }
    if (plan.endTime !== null) {
      params.set("endTime", plan.endTime.toString());
    }
    if (plan.freeDays.length > 0) {
      params.set("freeDays", plan.freeDays.join(","));
    }
    if (plan.nupaths.length > 0) {
      params.set("nupaths", plan.nupaths.join(","));
    }
    if (!plan.includeRemoteSections) {
      params.set("remote", "false");
    }
    if (!plan.includeHonorsSections) {
      params.set("honors", "false");
    }
    if (plan.hideFilledSections) {
      params.set("minSeats", "1");
    }
    if (plan.campuses !== null) {
      params.set("desiredCampuses", plan.campuses.toString());
    }
    if (hiddenSections.length > 0) {
      params.set("hiddenSections", hiddenSections.join(","));
    }

    router.push(`/scheduler/generator?${params.toString()}`);
  };

  const handleDelete = () => {
    onDelete(plan.id);
  };

  // Create color map for courses (same logic as getCourseColorMap but for plan courses)
  const courseColorMap = useMemo(() => {
    const map = new Map<string, CourseColor>();
    const courseKeys = plan.courses
      .map((c) => `${c.courseSubject} ${c.courseNumber}`)
      .sort();

    courseKeys.forEach((key, index) => {
      map.set(key, COURSE_COLORS[index % COURSE_COLORS.length]);
    });

    return map;
  }, [plan.courses]);

  // Helper to get color for a course
  const getCourseColor = (subject: string, number: string): CourseColor => {
    const key = `${subject} ${number}`;
    return courseColorMap.get(key) || COURSE_COLORS[0];
  };

  // Helper to format time (minutes since midnight to HH:MM AM/PM)
  const formatTime = (minutes: number | null): string => {
    if (minutes === null) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  // Helper to format free days
  const formatFreeDays = (days: string[]): string => {
    if (days.length === 0) return "";
    const dayNames: Record<string, string> = {
      "0": "Mondays",
      "1": "Tuesdays",
      "2": "Wednesdays",
      "3": "Thursdays",
      "4": "Fridays",
      "5": "Saturdays",
      "6": "Sundays",
    };
    const formatted = days.map((d) => dayNames[d] || d).join(", ");
    return `Free ${formatted}`;
  };

  // Get campus display text
  const getCampusText = (): string => {
    const parts: string[] = [];
    if (plan.includeRemoteSections) {
      parts.push("Remote");
    }
    return parts.length > 0 ? parts.join(", ") : "";
  };

  // Build filter tags
  const filterTags: ReactNode[] = [];

  // Location/Campus tag
  const campusText = getCampusText();
  if (campusText) {
    filterTags.push(
      <div
        key="location"
        className="bg-neu2 text-neu8 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
      >
        <MapPin className="h-3 w-3" />
        {campusText}
      </div>,
    );
  }

  // Time tag
  if (plan.startTime !== null || plan.endTime !== null) {
    const timeParts: string[] = [];
    if (plan.startTime !== null) {
      timeParts.push(`Start after ${formatTime(plan.startTime)}`);
    }
    if (plan.endTime !== null) {
      timeParts.push(`End before ${formatTime(plan.endTime)}`);
    }
    if (timeParts.length > 0) {
      filterTags.push(
        <div
          key="time"
          className="bg-neu2 text-neu8 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
        >
          <Clock className="h-3 w-3" />
          {timeParts.join(", ")}
        </div>,
      );
    }
  }

  // Free days tag
  const freeDaysText = formatFreeDays(plan.freeDays);
  if (freeDaysText) {
    filterTags.push(
      <div
        key="free-days"
        className="bg-neu2 text-neu8 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
      >
        {freeDaysText}
      </div>,
    );
  }

  // NUPaths tag
  if (plan.nupaths.length > 0) {
    filterTags.push(
      <div
        key="nupaths"
        className="bg-neu2 text-neu8 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
      >
        NU Paths {plan.nupaths.join(", ")}
      </div>,
    );
  }

  return (
    <div className="border-neu3 rounded-lg border bg-white p-6 shadow-sm">
      {/* Header with name and buttons */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">{plan.name}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            className="text-neu8 hover:text-neu9 flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit Plan
          </button>
          <button
            onClick={handleDelete}
            className="text-neu6 hover:text-red flex items-center transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Applied Filters Section */}
      <div className="mb-6">
        <h3 className="text-neu7 mb-3 text-xs font-bold uppercase">
          Applied Filters
        </h3>
        {filterTags.length === 0 ? (
          <p className="text-sm text-gray-500">No filters applied</p>
        ) : (
          <div className="flex flex-wrap gap-2">{filterTags}</div>
        )}
      </div>

      {/* Included Courses Section */}
      <div className="mb-6">
        <h3 className="text-neu7 mb-3 text-xs font-bold uppercase">
          Included Courses
        </h3>
        {plan.courses.length === 0 ? (
          <p className="text-sm text-gray-500">No courses</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {plan.courses.map((course) => {
              const color = getCourseColor(
                course.courseSubject,
                course.courseNumber,
              );
              return (
                <div
                  key={course.courseId}
                  className="text-neu8 border-neu3 relative flex items-center gap-2 overflow-hidden rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm"
                >
                  {/* Thin vertical color bar on left border */}
                  <div
                    className="absolute top-0 left-0 h-full w-1"
                    style={{ backgroundColor: color.accent }}
                  />
                  <span className="text-base font-bold">
                    {course.courseSubject} {course.courseNumber}
                  </span>
                  <span className="text-neu6 flex-1 truncate">
                    {course.courseName}
                  </span>
                  {course.isLocked && (
                    <Lock className="text-red h-4 w-4 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Favorited Schedules Section */}
      <div>
        <h3 className="text-neu7 mb-3 text-xs font-bold uppercase">
          Favorited Schedules
        </h3>
        {plan.favoritedSchedules.length === 0 ? (
          <p className="text-sm text-gray-500">No favorited schedules</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {plan.favoritedSchedules.map((schedule, scheduleIdx) => {
              // Transform favorited schedule sections to SectionWithCourse format
              const scheduleSections: SectionWithCourse[] =
                schedule.sections.map((s) => ({
                  id: s.sectionId,
                  crn: "", // Not available in favorited schedule data
                  faculty: "",
                  campus: "",
                  honors: false,
                  classType: "",
                  seatRemaining: 0,
                  seatCapacity: 0,
                  waitlistCapacity: 0,
                  waitlistRemaining: 0,
                  meetingTimes: s.meetingTimes.map((mt) => ({
                    days: mt.days,
                    startTime: mt.startTime,
                    endTime: mt.endTime,
                    final: false,
                  })),
                  courseId: 0, // Not available
                  courseName: "",
                  courseSubject: s.courseSubject,
                  courseNumber: s.courseNumber,
                }));

              // Create color map for this schedule
              const scheduleColorMap = getCourseColorMap([scheduleSections]);

              // Get unique courses for tags
              const courses = Array.from(
                new Set(
                  schedule.sections.map(
                    (s) => `${s.courseSubject} ${s.courseNumber}`,
                  ),
                ),
              );

              return (
                <div
                  key={schedule.id}
                  className="border-neu3 relative flex min-w-50 shrink-0 flex-col rounded-lg border bg-white p-3 shadow-sm"
                >
                  {/* Star icon */}
                  <Star className="fill-red text-red absolute top-2 right-2 z-10 h-4 w-4" />

                  {/* Mini Calendar */}
                  <div className="mb-2">
                    <MiniCalendar
                      schedule={scheduleSections}
                      colorMap={scheduleColorMap}
                      isSelected={false}
                      isFavorited={true}
                      scheduleIndex={scheduleIdx}
                      onClick={() => {
                        // Handle click - maybe navigate to view schedule?
                        console.log("Clicked schedule:", schedule.id);
                      }}
                      onToggleFavorite={() => {
                        // Handle unfavorite - delete favorited schedule
                        console.log("Toggle favorite:", schedule.id);
                      }}
                    />
                  </div>

                  {/* Schedule title */}
                  <div className="mb-2 text-sm font-semibold">
                    {schedule.name}
                  </div>

                  {/* Course tags with proper colors */}
                  <div className="flex flex-wrap gap-1">
                    {courses.slice(0, 4).map((courseKey) => {
                      const [subject, number] = courseKey.split(" ");
                      const color = getCourseColor(subject, number);
                      return (
                        <span
                          key={courseKey}
                          className="bg-neu1 text-neu8 flex items-center overflow-hidden rounded px-1.5 py-0.5 text-xs font-medium"
                        >
                          {/* Thin vertical color bar */}
                          <div
                            className="mr-1 h-full w-0.5 shrink-0"
                            style={{ backgroundColor: color.accent }}
                          />
                          {courseKey.replace(" ", "")}
                        </span>
                      );
                    })}
                    {courses.length > 4 && (
                      <span className="text-neu6 rounded px-1.5 py-0.5 text-xs">
                        +{courses.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
