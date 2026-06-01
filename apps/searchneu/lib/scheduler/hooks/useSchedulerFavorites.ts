"use client";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { SectionWithCourse } from "../filters";
import { getScheduleKey } from "../scheduleKey";

interface UseSchedulerFavoritesArgs {
  planId: number | null;
  schedules: SectionWithCourse[][];
  filteredSchedules: SectionWithCourse[][];
  isLoggedIn: boolean;
  favoritedSchedules: Map<string, number>;
  setFavoritedSchedules: Dispatch<SetStateAction<Map<string, number>>>;
}

interface UseSchedulerFavoritesReturn {
  isFavorited: (key: string) => boolean;
  toggleFavorite: (key: string) => void;
}

export function useSchedulerFavorites({
  planId,
  schedules,
  filteredSchedules,
  isLoggedIn,
  favoritedSchedules,
  setFavoritedSchedules,
}: UseSchedulerFavoritesArgs): UseSchedulerFavoritesReturn {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const isFavorited = useCallback(
    (key: string) => favoritedSchedules.has(key),
    [favoritedSchedules],
  );

  const toggleFavorite = useCallback(
    (key: string) => {
      const currentlyFavorited = favoritedSchedules.has(key);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      // Optimistic update for favoriting
      if (!currentlyFavorited) {
        setFavoritedSchedules((prev) => {
          const next = new Map(prev);
          next.set(key, 0);
          return next;
        });
      }

      debounceRef.current = setTimeout(() => {
        if (currentlyFavorited) {
          const favoritedId = favoritedSchedules.get(key);
          setFavoritedSchedules((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });

          if (favoritedId && isLoggedIn) {
            fetch(`/api/scheduler/favorited-schedules/${favoritedId}`, {
              method: "DELETE",
            }).catch(() => {
              setFavoritedSchedules((prev) => {
                const next = new Map(prev);
                next.set(key, favoritedId);
                return next;
              });
            });
          }
        } else {
          const schedule =
            filteredSchedules.find((s) => getScheduleKey(s) === key) ??
            schedules.find((s) => getScheduleKey(s) === key);

          if (!schedule) {
            setFavoritedSchedules((prev) => {
              const next = new Map(prev);
              next.delete(key);
              return next;
            });
            return;
          }

          if (!isLoggedIn || !planId) return;

          const sectionIds = schedule.map((s) => s.id);

          fetch("/api/scheduler/favorited-schedules", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId,
              name: "My Favorited Schedule",
              sectionIds,
            }),
          })
            .then((res) => {
              if (!res.ok) throw new Error("Failed to favorite");
              return res.json();
            })
            .then((data) => {
              setFavoritedSchedules((prev) => {
                const next = new Map(prev);
                next.set(key, data.id);
                return next;
              });
            })
            .catch(() => {
              setFavoritedSchedules((prev) => {
                const next = new Map(prev);
                next.delete(key);
                return next;
              });
            });
        }
      }, 300);
    },
    [
      favoritedSchedules,
      filteredSchedules,
      schedules,
      planId,
      isLoggedIn,
      setFavoritedSchedules,
    ],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { isFavorited, toggleFavorite };
}
