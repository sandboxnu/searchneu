import { useCallback, useRef, useSyncExternalStore } from "react";
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
  const defaultValueRef = useRef(defaultValue);
  const cachedRef = useRef<{ raw: string | null; parsed: T } | null>(null);

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
      const raw = window.localStorage.getItem(key);
      if (cachedRef.current && cachedRef.current.raw === raw) {
        return cachedRef.current.parsed;
      }
      const parsed =
        raw !== null ? (JSON.parse(raw) as T) : defaultValueRef.current;
      cachedRef.current = { raw, parsed };
      return parsed;
    } catch {
      return defaultValueRef.current;
    }
  }, [key]);

  const getServerSnapshot = useCallback(() => defaultValueRef.current, []);

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
