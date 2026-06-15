"use client";

import { useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type SectionWithCourse } from "@/lib/scheduler/filters";
import { type CourseColor } from "@/lib/scheduler/courseColors";
import { getScheduleKey } from "@/lib/scheduler/scheduleKey";
import { MiniCalendar } from "../../shared/MiniCalendar";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type SidebarTab = "favorites" | "filters" | "all";

const EMPTY_STATES: Record<SidebarTab, { title: string; description: string }> =
  {
    favorites: {
      title: "No favorited schedules",
      description: "Tap the star on a schedule to save it here.",
    },
    filters: {
      title: "No schedules match your filters",
      description: "Try adjusting your filters or course selection.",
    },
    all: {
      title: "No schedules yet",
      description: "Add courses to generate possible schedules.",
    },
  };

interface ScheduleSidebarProps {
  allSchedules: SectionWithCourse[][];
  filteredSchedules: SectionWithCourse[][];
  favoritedKeys: Map<string, number>;
  selectedScheduleKey: string | null;
  colorMap: Map<string, CourseColor>;
  isLoading: boolean;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onSelectSchedule: (scheduleKey: string) => void;
  onToggleFavorite: (scheduleKey: string) => void;
}

const SKELETON_DAYS = ["S", "M", "T", "W", "TH", "F", "S"];

function SkeletonMiniCalendar() {
  return (
    <div className="border-neu2 bg-neu0 w-full rounded-lg border p-2">
      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 gap-0">
        {SKELETON_DAYS.map((day, i) => (
          <div
            key={i}
            className="text-neu3 text-center text-[14px] font-semibold"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Skeleton async bars */}
      <div className="mb-1 space-y-0.5">
        <div className="grid grid-cols-7 gap-0">
          <div />
          <div className="bg-neu2 h-2 rounded-xs" />
          <div />
          <div className="bg-neu2 h-2 rounded-xs" />
          <div className="bg-neu2 h-2 rounded-xs" />
          <div />
          <div />
        </div>
      </div>

      {/* Skeleton calendar blocks */}
      <div
        className="relative grid grid-cols-7 gap-0"
        style={{ height: "122px" }}
      >
        <div />
        <div className="relative h-full">
          <div
            className="bg-neu2 absolute inset-x-px rounded-xs"
            style={{ top: "30px", height: "40px" }}
          />
        </div>
        <div />
        <div />
        <div />
        <div />
        <div className="relative h-full">
          <div
            className="bg-neu2 absolute inset-x-px rounded-xs"
            style={{ top: "25px", height: "45px" }}
          />
        </div>
      </div>
    </div>
  );
}

export function ScheduleSidebar({
  allSchedules,
  filteredSchedules,
  favoritedKeys,
  selectedScheduleKey,
  colorMap,
  isLoading,
  activeTab,
  onTabChange,
  onSelectSchedule,
  onToggleFavorite,
}: ScheduleSidebarProps) {
  "use no memo"; // issue: https://github.com/TanStack/virtual/issues/743

  const scrollRef = useRef<HTMLDivElement>(null);

  const displayedSchedules = useMemo(() => {
    if (activeTab === "all") return allSchedules;
    if (activeTab === "filters") return filteredSchedules;
    return allSchedules.filter((s) => favoritedKeys.has(getScheduleKey(s)));
  }, [activeTab, allSchedules, filteredSchedules, favoritedKeys]);

  const scheduleKeys = useMemo(
    () => displayedSchedules.map((s) => getScheduleKey(s)),
    [displayedSchedules],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: displayedSchedules.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 180,
    overscan: 5,
    gap: 8,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const handleSelect = useCallback(
    (key: string) => onSelectSchedule(key),
    [onSelectSchedule],
  );

  const handleToggleFav = useCallback(
    (key: string) => onToggleFavorite(key),
    [onToggleFavorite],
  );

  const tabItems: { key: SidebarTab; label: string; count: number }[] = [
    {
      key: "favorites",
      label: "FAVORITES",
      count: favoritedKeys.size,
    },
    {
      key: "filters",
      label: "FILTERED",
      count: filteredSchedules.length,
    },
    {
      key: "all",
      label: "ALL",
      count: allSchedules.length,
    },
  ];

  return (
    <div className="flex h-full w-77.5 shrink-0 flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-4 px-3 pt-6">
        <div className="border-neu3 flex items-center gap-4 border-b">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`-mb-px flex cursor-pointer items-center gap-1 py-1 text-xs font-bold uppercase transition-colors ${
                activeTab === tab.key
                  ? "border-neu5 text-neu6 border-b"
                  : "text-neu4 hover:text-neu5 border-b border-transparent"
              }`}
            >
              {tab.key === "favorites" && (
                <StarIcon
                  className={cn("text-neu4 size-3.5", {
                    "text-neu6": activeTab === "favorites",
                  })}
                />
              )}
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Virtualized schedule list */}
      <div
        ref={scrollRef}
        className="flex-1 scrollbar-none overflow-y-auto px-3 pt-3 pb-4 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {displayedSchedules.length > 0 ? (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: "relative",
              width: "100%",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const schedule = displayedSchedules[virtualItem.index];
              const key = scheduleKeys[virtualItem.index];
              return (
                <div
                  key={key}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <MiniCalendar
                    schedule={schedule}
                    colorMap={colorMap}
                    isSelected={key === selectedScheduleKey}
                    isFavorited={favoritedKeys.has(key)}
                    scheduleIndex={virtualItem.index}
                    onClick={() => handleSelect(key)}
                    onToggleFavorite={() => handleToggleFav(key)}
                  />
                </div>
              );
            })}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonMiniCalendar key={i} />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
            <h2 className="text-neu7 text-base font-semibold">
              {EMPTY_STATES[activeTab].title}
            </h2>
            <p className="text-neu5 text-sm">
              {EMPTY_STATES[activeTab].description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
