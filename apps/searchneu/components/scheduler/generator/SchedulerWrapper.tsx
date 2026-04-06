"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  filterSchedules,
  type ScheduleFilters,
  type SectionWithCourse,
} from "@/lib/scheduler/filters";
import { getCourseColorMap } from "@/lib/scheduler/courseColors";
import { getScheduleKey } from "@/lib/scheduler/scheduleKey";
import { SchedulerView } from "./calendar/SchedulerView";
import { ScheduleSidebar } from "./right-sidebar/ScheduleSidebar";
import { FilterPanel } from "./left-sidebar/FilterPanel";
import { GroupedTerms, Campus, Nupath } from "@/lib/catalog/types";
import {
  PlanData,
  PlanCourse,
  PlanSection,
  PlanUpdateData,
} from "@/lib/scheduler/types";

interface SchedulerWrapperProps {
  nupathOptions: { label: string; value: string }[];
  terms: GroupedTerms;
  campuses: Campus[];
  nupaths: Nupath[];
}

export function SchedulerWrapper({
  nupathOptions,
  terms,
  campuses,
  nupaths,
}: SchedulerWrapperProps) {
  const router = useRouter();
  const [selectedScheduleKey, setSelectedScheduleKey] = useState<string | null>(
    null,
  );
  // Map of schedule key to favorited-schedule ID from the API
  const [favoritedSchedules, setFavoritedSchedules] = useState<
    Map<string, number>
  >(new Map());
  // Store the plan ID from when we save the plan initially
  const [planId, setPlanId] = useState<number | null>(null);
  const [planName, setPlanName] = useState<string>("Plan");
  const searchParams = useSearchParams();
  const planIdFromUrl = searchParams.get("planId");

  const [filters, setFilters] = useState<ScheduleFilters>({});
  const [planRefreshTrigger, setPlanRefreshTrigger] = useState(0);
  const [schedules, setSchedules] = useState<SectionWithCourse[][]>([]);
  const [courseToSections, setCourseToSections] = useState<
    Map<number, SectionWithCourse[]>
  >(new Map());

  // Track whether we've already synced the plan to avoid duplicate syncs
  const planSyncRef = useRef(false);
  // Track if we just loaded filters from DB to skip initial patch
  const justLoadedFiltersRef = useRef(false);
  // Track previous locked/hidden state to avoid unnecessary course updates
  const prevLockedHiddenRef = useRef<{
    locked: Set<number>;
    hidden: Set<number>;
  } | null>(null);
  // Track previous locked course IDs to detect unlocks
  const prevLockedCourseIdsRef = useRef<Set<number>>(new Set());
  // Debounce timer for schedule regeneration on unlock
  const regenerateDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // Debounce timer for favorite/unfavorite requests
  const favoriteDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Build campus ID -> campus name mapping from the provided campuses data
  const campusIdToName = useMemo(() => {
    const mapping = new Map<number, string>();
    for (const campus of campuses) {
      mapping.set(campus.id, campus.name);
    }
    return mapping;
  }, [campuses]);

  // Build nupath ID -> short code mapping from the provided nupaths data
  const nupathIdToShort = useMemo(() => {
    const mapping = new Map<number, string>();
    for (const nupath of nupaths) {
      mapping.set(nupath.id, nupath.short);
    }
    return mapping;
  }, [nupaths]);

  // Build nupath short code -> ID reverse mapping for saving
  const nupathShortToId = useMemo(() => {
    const mapping = new Map<string, number>();
    for (const nupath of nupaths) {
      mapping.set(nupath.short, nupath.id);
    }
    return mapping;
  }, [nupaths]);

  const toggleHiddenSection = useCallback((sectionId: number) => {
    setFilters((prev) => {
      const next = new Set(prev.hiddenSectionIds ?? []);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return { ...prev, hiddenSectionIds: next };
    });
  }, []);

  // Reset sync ref when URL planId changes or when plan is refreshed
  useEffect(() => {
    planSyncRef.current = false;
  }, [planIdFromUrl, planRefreshTrigger]);

  // Load existing plan from URL if available
  useEffect(() => {
    const loadPlan = async () => {
      if (!planIdFromUrl) {
        return;
      }

      // Prevent duplicate loads in React Strict Mode
      if (planSyncRef.current) {
        return;
      }

      planSyncRef.current = true;

      try {
        const planIdNum = parseInt(planIdFromUrl);
        const response = await fetch(`/api/scheduler/saved-plans/${planIdNum}`);

        if (!response.ok) {
          console.error("Failed to load plan:", response.status);
          return;
        }

        const planData = (await response.json()) as PlanData;
        setPlanId(planIdNum);
        setPlanName(planData.name);

        // Extract locked courses and hidden sections from saved plan
        const lockedCourseIds: Set<number> = new Set();
        const hiddenSectionIds: Set<number> = new Set();
        const allCourseIds: number[] = [];

        if (planData.courses && Array.isArray(planData.courses)) {
          planData.courses.forEach((course: PlanCourse) => {
            allCourseIds.push(course.courseId);
            if (course.isLocked) {
              lockedCourseIds.add(course.courseId);
            }
            if (course.sections && Array.isArray(course.sections)) {
              course.sections.forEach((section: PlanSection) => {
                if (section.isHidden) {
                  hiddenSectionIds.add(section.sectionId);
                }
              });
            }
          });
        }

        // Apply saved filter values to the filters state
        const newFilters: ScheduleFilters = {
          ...filters,
          startTime: planData.startTime,
          endTime: planData.endTime,
          specificDaysFree: planData.freeDays?.map(Number),
          includeHonors: planData.includeHonorsSections,
          includesRemote: planData.includeRemoteSections,
          minSeatsLeft: planData.hideFilledSections ? 1 : undefined,
          numCourses: planData.numCourses,
          lockedCourseIds: lockedCourseIds,
          hiddenSectionIds: hiddenSectionIds,
        };

        // Only include desiredCampus if campus is not null/undefined
        if (planData.campus) {
          const campusName = campusIdToName.get(planData.campus);
          if (campusName) {
            newFilters.desiredCampus = campusName;
          }
        }

        // Convert nupath IDs to short codes
        if (planData.nupaths && planData.nupaths.length > 0) {
          newFilters.nupaths = planData.nupaths
            .map((id: number) => nupathIdToShort.get(id))
            .filter(
              (short: string | undefined): short is string =>
                short !== undefined,
            );
        }

        setFilters(newFilters);
        justLoadedFiltersRef.current = true;

        // Fetch sections and generate schedules for the plan
        if (allCourseIds.length > 0) {
          try {
            const courseToSectionsMap = new Map<number, SectionWithCourse[]>();

            // Fetch sections for all courses in the plan
            await Promise.all(
              allCourseIds.map(async (courseId) => {
                try {
                  const sectionsResponse = await fetch(
                    `/api/scheduler/sections/${courseId}`,
                  );
                  if (!sectionsResponse.ok) {
                    throw new Error(
                      `Failed to fetch sections: ${sectionsResponse.status}`,
                    );
                  }
                  const sections = await sectionsResponse.json();
                  courseToSectionsMap.set(courseId, sections);
                } catch (error) {
                  console.error(
                    `Failed to fetch sections for course ${courseId}:`,
                    error,
                  );
                }
              }),
            );

            // Generate schedules with locked and optional courses
            const lockedCourseIdsArray = Array.from(lockedCourseIds);
            const optionalCourseIdsArray = allCourseIds.filter(
              (id) => !lockedCourseIdsArray.includes(id),
            );

            const params = new URLSearchParams();
            if (lockedCourseIdsArray.length > 0) {
              params.append("lockedCourseIds", lockedCourseIdsArray.join(","));
            }
            if (optionalCourseIdsArray.length > 0) {
              params.append(
                "optionalCourseIds",
                optionalCourseIdsArray.join(","),
              );
            }
            if (planData.numCourses !== undefined) {
              params.append("numCourses", planData.numCourses.toString());
            }

            const schedulesResponse = await fetch(
              `/api/scheduler/generate-schedules?${params.toString()}`,
            );

            if (!schedulesResponse.ok) {
              throw new Error(
                `Failed to generate schedules: ${schedulesResponse.status}`,
              );
            }

            const generatedSchedules = await schedulesResponse.json();

            setSchedules(generatedSchedules);
            setCourseToSections(courseToSectionsMap);

            // Load schedule keys
            const generatedScheduleKeys = new Set(
              generatedSchedules.map((schedule: SectionWithCourse[]) =>
                getScheduleKey(schedule),
              ),
            );

            // Load favorited schedule keys
            const favMap = new Map<string, number>();
            for (const favSchedule of planData.favoritedSchedules || []) {
              if (favSchedule.sections && Array.isArray(favSchedule.sections)) {
                const favScheduleKey = favSchedule.sections
                  .map((section: { sectionId: number }) => section.sectionId)
                  .sort((a: number, b: number) => a - b)
                  .join("|");
                // If key doesn't exist in generated schedules, unfavorite it
                if (!generatedScheduleKeys.has(favScheduleKey)) {
                  try {
                    await fetch(
                      `/api/scheduler/favorited-schedules/${favSchedule.id}`,
                      { method: "DELETE" },
                    );
                  } catch (error) {
                    console.error(
                      `Failed to unfavorite schedule ${favSchedule.id}:`,
                      error,
                    );
                  }
                } else {
                  favMap.set(favScheduleKey, favSchedule.id);
                }
              }
            }
            setFavoritedSchedules(favMap);
          } catch (error) {
            console.error("Error loading sections and schedules:", error);
          }
        }
      } catch (error) {
        console.error("Error loading plan:", error);
      }
    };

    loadPlan();
  }, [planIdFromUrl, planRefreshTrigger]);

  // Update plan when filters change
  useEffect(() => {
    // Don't update if we don't have a plan ID yet
    if (!planId) {
      return;
    }

    // Skip the patch if we just loaded filters from the DB
    if (justLoadedFiltersRef.current) {
      justLoadedFiltersRef.current = false;
      return;
    }

    // Debounce the update to avoid excessive requests
    const timer = setTimeout(async () => {
      try {
        // Helper to check set equality
        const setsEqual = (a: Set<number>, b: Set<number>) =>
          a.size === b.size && [...a].every((id) => b.has(id));

        // Check if locked/hidden sections have changed
        const currentLocked = filters.lockedCourseIds ?? new Set();
        const currentHidden = filters.hiddenSectionIds ?? new Set();
        const prevLocked = prevLockedHiddenRef.current?.locked ?? new Set();
        const prevHidden = prevLockedHiddenRef.current?.hidden ?? new Set();

        const lockedChanged = !setsEqual(currentLocked, prevLocked);
        const hiddenChanged = !setsEqual(currentHidden, prevHidden);

        const updateData: PlanUpdateData = {
          startTime: filters.startTime ?? null,
          endTime: filters.endTime ?? null,
          freeDays: filters.specificDaysFree ?? [],
          includeHonorsSections: filters.includeHonors ?? false,
          includeRemoteSections: filters.includesRemote ?? true,
          hideFilledSections: (filters.minSeatsLeft ?? 0) > 0,
          nupaths: [],
          numCourses: filters.numCourses,
        };

        // Convert campus name back to ID for storage
        if (filters.desiredCampus) {
          // Find the campus ID for this campus name
          let campusId: number | null = null;
          for (const [id, name] of campusIdToName.entries()) {
            if (name === filters.desiredCampus) {
              campusId = id;
              break;
            }
          }
          updateData.campus = campusId;
        } else {
          updateData.campus = null;
        }

        // Convert nupath short codes back to IDs for storage
        if (filters.nupaths && filters.nupaths.length > 0) {
          updateData.nupaths = filters.nupaths
            .map((short: string) => nupathShortToId.get(short))
            .filter((id): id is number => id !== undefined);
        } else {
          updateData.nupaths = [];
        }

        // Only include courses if locked/hidden changed
        if (lockedChanged || hiddenChanged) {
          const courses = Array.from(courseToSections.entries()).map(
            ([courseId, sections]) => ({
              courseId,
              isLocked: filters.lockedCourseIds?.has(courseId) ?? false,
              sections: sections.map((section) => ({
                sectionId: section.id,
                isHidden: filters.hiddenSectionIds?.has(section.id) ?? false,
              })),
            }),
          );
          updateData.courses = courses;

          // Update the ref
          prevLockedHiddenRef.current = {
            locked: new Set(currentLocked),
            hidden: new Set(currentHidden),
          };
        }

        const response = await fetch(`/api/scheduler/saved-plans/${planId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          console.error(
            "Failed to update plan:",
            response.status,
            response.statusText,
          );
        }
      } catch (error) {
        console.error("Error updating plan:", error);
      }
    }, 300); // Debounce for 0.3 seconds

    return () => clearTimeout(timer);
  }, [filters, courseToSections]);

  const regenerateSchedules = useCallback(
    async (lockedCourseIds: Set<number>) => {
      if (courseToSections.size === 0) return;

      try {
        // Calculate optional course IDs from the available courses
        const allCourseIds = Array.from(courseToSections.keys());
        const lockedCourseIdsArray = Array.from(lockedCourseIds);
        const optionalCourseIdsArray = allCourseIds.filter(
          (id) => !lockedCourseIdsArray.includes(id),
        );

        // Build query parameters
        const params = new URLSearchParams();
        if (lockedCourseIdsArray.length > 0) {
          params.append("lockedCourseIds", lockedCourseIdsArray.join(","));
        }
        if (optionalCourseIdsArray.length > 0) {
          params.append("optionalCourseIds", optionalCourseIdsArray.join(","));
        }
        if (filters.numCourses !== undefined) {
          params.append("numCourses", filters.numCourses.toString());
        }

        // Fetch new schedules
        const response = await fetch(
          `/api/scheduler/generate-schedules?${params.toString()}`,
        );

        if (!response.ok) {
          console.error("Failed to regenerate schedules:", response.status);
          return;
        }

        const newSchedules = await response.json();
        setSchedules(newSchedules);
      } catch (error) {
        console.error("Error regenerating schedules:", error);
      }
    },
    [courseToSections, filters.numCourses],
  );

  const onSchedulesGenerated = useCallback(() => {
    setPlanRefreshTrigger((prev) => prev + 1);
  }, []);

  const filteredSchedules = filterSchedules(schedules, filters);

  const handleLockedCourseIdsChange = useCallback(
    (ids: Set<number>) => {
      setFilters((prev) => ({
        ...prev,
        lockedCourseIds: ids.size > 0 ? ids : undefined,
      }));

      // Detect if any courses were unlocked
      const wasUnlocked = Array.from(prevLockedCourseIdsRef.current).some(
        (id) => !ids.has(id),
      );

      // Update the previous locked course IDs for next time
      prevLockedCourseIdsRef.current = new Set(ids);

      // If a course was unlocked, debounce schedule regeneration
      if (wasUnlocked) {
        // Clear existing debounce timer if any
        if (regenerateDebounceRef.current) {
          clearTimeout(regenerateDebounceRef.current);
        }

        // Set new debounce timer
        regenerateDebounceRef.current = setTimeout(() => {
          // Regenerate schedules with the new locked course IDs
          regenerateSchedules(ids);
          regenerateDebounceRef.current = null;
        }, 500);
      }
    },
    [regenerateSchedules],
  );

  // Compute color map from all schedules (stable across filter changes)
  const colorMap = useMemo(() => getCourseColorMap(schedules), [schedules]);

  const currentScheduleKey =
    selectedScheduleKey ??
    (filteredSchedules.length > 0
      ? getScheduleKey(filteredSchedules[0])
      : null);

  const handleToggleFavorite = (key: string) => {
    const isFavorited = favoritedSchedules.has(key);

    // Clear any pending debounce timer
    if (favoriteDebounceRef.current) {
      clearTimeout(favoriteDebounceRef.current);
    }

    // Show optimistic update immediately
    if (!isFavorited) {
      setFavoritedSchedules((prev) => {
        const next = new Map(prev);
        next.set(key, 0); // Temporary ID
        return next;
      });
    }

    // Debounce the actual request
    favoriteDebounceRef.current = setTimeout(() => {
      if (isFavorited) {
        // Unfavorite logic
        const favoritedId = favoritedSchedules.get(key);
        if (favoritedId) {
          // optimistic update — remove immediately
          setFavoritedSchedules((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });

          fetch(`/api/scheduler/favorited-schedules/${favoritedId}`, {
            method: "DELETE",
          }).catch((error) => {
            console.error("Error unfavoriting schedule:", error);
            // Revert on error
            setFavoritedSchedules((current) => {
              const updated = new Map(current);
              updated.set(key, favoritedId);
              return updated;
            });
          });
        }
      } else {
        // Favorite logic
        const schedule =
          filteredSchedules.find((s) => getScheduleKey(s) === key) ??
          schedules.find((s) => getScheduleKey(s) === key);

        if (!schedule) {
          console.error("Could not find schedule to favorite");
          setFavoritedSchedules((current) => {
            const updated = new Map(current);
            updated.delete(key);
            return updated;
          });
          return;
        }

        const sectionIds = (schedule as SectionWithCourse[]).map(
          (section: SectionWithCourse) => section.id,
        );

        fetch("/api/scheduler/favorited-schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            name: "My Favorited Schedule",
            sectionIds,
          }),
        })
          .then((response) => {
            if (!response.ok) {
              return response.json().then((error) => {
                throw new Error(JSON.stringify(error));
              });
            }
            return response.json();
          })
          .then((data) => {
            setFavoritedSchedules((current) => {
              const updated = new Map(current);
              updated.set(key, data.id);
              return updated;
            });
          })
          .catch((error) => {
            console.error("Error favoriting schedule:", error);
            setFavoritedSchedules((current) => {
              const updated = new Map(current);
              updated.delete(key);
              return updated;
            });
          });
      }
    }, 300);
  };

  const isFavorited = currentScheduleKey
    ? favoritedSchedules.has(currentScheduleKey)
    : false;

  // Clean up debounce timers on unmount
  useEffect(() => {
    return () => {
      if (favoriteDebounceRef.current) {
        clearTimeout(favoriteDebounceRef.current);
      }
      if (regenerateDebounceRef.current) {
        clearTimeout(regenerateDebounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-[calc(100vh-72px)] w-full overflow-hidden">
      <div className="w-fit shrink-0 overflow-hidden">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          nupathOptions={nupathOptions}
          courseToSections={courseToSections}
          hiddenSectionIds={filters.hiddenSectionIds ?? new Set()}
          onToggleHiddenSection={toggleHiddenSection}
          terms={terms}
          lockedCourseIds={filters.lockedCourseIds ?? new Set()}
          onLockedCourseIdsChange={handleLockedCourseIdsChange}
          planId={planIdFromUrl ? parseInt(planIdFromUrl) : undefined}
          onSchedulesGenerated={onSchedulesGenerated}
        />
      </div>
      <div className="flex min-w-0 flex-1 overflow-hidden pl-6">
        <div className="min-w-0 flex-1">
          <p className="text-neu4 mb-1 text-sm font-bold uppercase">
            {planName}
          </p>
          <SchedulerView
            schedules={filteredSchedules}
            allSchedules={schedules}
            selectedScheduleKey={currentScheduleKey}
            colorMap={colorMap}
            isFavorited={isFavorited}
            onToggleFavorite={() => {
              if (selectedScheduleKey) {
                handleToggleFavorite(selectedScheduleKey);
              }
            }}
          />
        </div>
        <ScheduleSidebar
          allSchedules={schedules}
          filteredSchedules={filteredSchedules}
          favoritedKeys={favoritedSchedules}
          selectedScheduleKey={currentScheduleKey}
          colorMap={colorMap}
          onSelectSchedule={setSelectedScheduleKey}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </div>
  );
}
