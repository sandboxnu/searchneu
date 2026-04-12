import { useCallback, useSyncExternalStore } from "react";
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
  const subscribe = useCallback(
    (callback: () => void) => {
      const handler = (e: Event) => {
        if ((e as CustomEvent).detail.key === key) callback();
      };
      window.addEventListener("local-storage-sync", handler);
      return () => window.removeEventListener("local-storage-sync", handler);
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const storedValue = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setValue = useCallback(
    (value: T) => {
      try {
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
