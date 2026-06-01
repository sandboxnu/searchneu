"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { SavedPlan } from "../Dashboard";
import { Pencil, Trash2, Lock } from "lucide-react";
import {
  COURSE_COLORS,
  type CourseColor,
  getCourseColorMap,
} from "@/lib/scheduler/courseColors";
import { MiniCalendar } from "../../shared/MiniCalendar";
import type { SectionWithCourse } from "@/lib/scheduler/filters";
import { FilterTags } from "./FilterTags";
import type { Nupath, Campus } from "@/lib/catalog/types";

interface PlanCardProps {
  plan: SavedPlan;
  onDelete: (planId: number) => void;
  campuses: Campus[];
  nupaths: Nupath[];
}

export function PlanCard({ plan, onDelete, campuses, nupaths }: PlanCardProps) {
  const router = useRouter();

  const handleEdit = () => {
    const params = new URLSearchParams();
    params.set("planId", plan.id.toString());
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

  return (
    <div className="border-neu3 rounded-lg border bg-white p-6 shadow-sm">
      {/* Header with name and buttons */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">{plan.name}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            className="border-neu3 bg-neu25 text-neu8 hover:bg-neu3 hover:text-neu9 flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" />
            Edit Plan
          </button>
          <button
            onClick={handleDelete}
            className="border-neu3 bg-neu25 text-neu8 hover:bg-red/5 hover:text-red flex cursor-pointer items-center rounded-full border px-3 py-1.5 transition-colors"
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
        <FilterTags plan={plan} campuses={campuses} nupaths={nupaths} />
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
                  className="relative flex min-w-0 items-center gap-1.5 overflow-hidden rounded-sm py-1 pr-3 pl-1 text-sm"
                  style={{
                    backgroundColor: color.fill,
                  }}
                >
                  <div
                    className="h-full w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: color.accent }}
                  />
                  <div className="flex items-center gap-1.5 pt-1 pl-1.5">
                    <span className="shrink-0 text-sm font-bold text-[#333]">
                      {course.courseSubject} {course.courseNumber}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-[#858585]">
                      {course.courseName}
                    </span>
                  </div>
                  {course.isLocked && (
                    <Lock className="h-3.5 w-3.5 shrink-0 text-red-500" />
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
                  onClick={handleEdit}
                  className="border-neu3 relative flex min-w-50 shrink-0 cursor-pointer flex-col rounded-xl border bg-[#F8F9F9] p-3 transition-colors hover:bg-[#F0F1F1]"
                >
                  {/* Mini Calendar */}
                  <div className="mb-2">
                    <MiniCalendar
                      schedule={scheduleSections}
                      colorMap={scheduleColorMap}
                      isSelected={false}
                      isFavorited={true}
                      scheduleIndex={scheduleIdx}
                      onClick={() => {}}
                      onToggleFavorite={() => {}}
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
                          className="text-neu8 flex items-center overflow-hidden rounded border px-1.5 py-0.5 text-xs font-medium"
                          style={{
                            borderColor: color.accent,
                            backgroundColor: color.fill,
                          }}
                        >
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
