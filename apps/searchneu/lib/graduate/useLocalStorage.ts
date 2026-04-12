import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Using this hook allows for any component to access localstorage as NextJS
 * uses SSR, so localstorage may not be accessible upon initial page load.
 * Accessing the hook allows for the functionality of setting and getting a
 * value in localstorage. The storedValue returned is the value in localstorage
 * for the key given to this hook. If it is undefined, the hook will return null.
 *
 * When multiple components use the same key, calling setValue in one will
 * automatically update all others via a custom DOM event.
 *
 * @param key Key for the localstorage value.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue);

  // Read from localStorage after mount — the lazy initializer doesn't help
  // in Next.js because React reuses the server-side defaultValue during
  // hydration and never re-runs it on the client.
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  // Sync across hook instances in the same tab
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.key === key) {
        setStoredValue(detail.value as T);
      }
    };
    window.addEventListener("local-storage-sync", handler);
    return () => window.removeEventListener("local-storage-sync", handler);
  }, [key]);

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(
          new CustomEvent("local-storage-sync", { detail: { key, value } }),
        );
      } catch (error) {
        toast(`${error}`);
      }
    },
    [key],
  );

  return [storedValue, setValue];
}
