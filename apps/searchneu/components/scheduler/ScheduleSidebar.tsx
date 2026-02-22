"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type SectionWithCourse } from "@/lib/scheduler/filters";
import { type CourseColor } from "@/lib/scheduler/courseColors";
import { getScheduleKey } from "@/lib/scheduler/scheduleKey";
import { MiniCalendar } from "./MiniCalendar";

type SidebarTab = "favorites" | "filters" | "all";

interface ScheduleSidebarProps {
  allSchedules: SectionWithCourse[][];
  filteredSchedules: SectionWithCourse[][];
  favoritedKeys: Set<string>;
  selectedScheduleKey: string | null;
  colorMap: Map<string, CourseColor>;
  onSelectSchedule: (scheduleKey: string) => void;
  onToggleFavorite: (scheduleKey: string) => void;
}

export function ScheduleSidebar({
  allSchedules,
  filteredSchedules,
  favoritedKeys,
  selectedScheduleKey,
  colorMap,
  onSelectSchedule,
  onToggleFavorite,
}: ScheduleSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("filters");
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
      label: "FILTERS",
      count: filteredSchedules.length,
    },
    {
      key: "all",
      label: "ALL",
      count: allSchedules.length,
    },
  ];

  return (
    <div className="flex h-[calc(100vh-72px)] w-[310px] shrink-0 flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-4 px-3 pt-6">
        <div className="border-neu3 flex items-center gap-4 border-b">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`mb-[-1px] flex cursor-pointer items-center gap-1 py-1 text-xs font-bold uppercase transition-colors ${
              activeTab === tab.key
                ? "border-neu5 text-neu6 border-b"
                : "text-neu4 hover:text-neu5 border-b border-transparent"
            }`}
          >
            {tab.key === "favorites" && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={activeTab === "favorites" ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            )}
            {tab.label} ({tab.count})
          </button>
        ))}
        </div>
      </div>

      {/* Virtualized schedule list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 pt-3 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
        ) : (
          <div className="text-neu6 py-8 text-center text-sm">
            {activeTab === "favorites"
              ? "No favorited schedules yet."
              : "No schedules found."}
          </div>
        )}
      </div>
    </div>
  );
}
