"use client";

import { useCallback } from "react";

type HistoryMode = "push" | "replace";

/**
 * Centralizes the "mutate the URL search params" pattern used across the
 * catalog filters. Every writer reads the *live* params from the URL (so it
 * stays correct inside debounced callbacks), skips no-op writes, and pushes or
 * replaces history as requested.
 */
export function useSearchParamWriter() {
  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void, mode: HistoryMode = "push") => {
      const params = new URLSearchParams(window.location.search);
      mutate(params);

      const qs = params.toString();
      const url = qs
        ? `${window.location.pathname}?${qs}`
        : window.location.pathname;

      // avoid redundant history entries when nothing actually changed
      if (url === `${window.location.pathname}${window.location.search}`)
        return;

      if (mode === "replace") window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [],
  );

  /** Replace all values for a repeated key (e.g. multiselect chips). */
  const setValues = useCallback(
    (key: string, values: string[], mode?: HistoryMode) =>
      commit((params) => {
        params.delete(key);
        values.forEach((v) => params.append(key, v));
      }, mode),
    [commit],
  );

  /** Set a single value, or remove the key entirely when `value` is null. */
  const setValue = useCallback(
    (key: string, value: string | null, mode?: HistoryMode) =>
      commit((params) => {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }, mode),
    [commit],
  );

  return { commit, setValues, setValue };
}
