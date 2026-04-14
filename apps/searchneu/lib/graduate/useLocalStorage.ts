import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

function readStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * SSR-safe localStorage hook with cross-component sync.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => readStorage(key, defaultValue));

  // Sync when another component writes to the same key
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.key === key) {
        setValue(readStorage(key, defaultValue));
      }
    };
    window.addEventListener("local-storage-sync", handler);
    return () => window.removeEventListener("local-storage-sync", handler);
  }, [key, defaultValue]);

  const set = useCallback(
    (newValue: T) => {
      try {
        setValue(newValue);
        window.localStorage.setItem(key, JSON.stringify(newValue));
        window.dispatchEvent(
          new CustomEvent("local-storage-sync", { detail: { key } }),
        );
      } catch (error) {
        toast(`${error}`);
      }
    },
    [key],
  );

  return [value, set];
}
