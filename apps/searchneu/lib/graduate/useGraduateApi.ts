import { useState, useEffect } from "react";
import useSWR from "swr";
import { Major, Minor, Template } from "./types";
import {
  GetSupportedMajorsResponse,
  GetSupportedMinorsResponse,
} from "./api-response-types";

/**
 * Fetch several majors/minors for one catalog year. A name that 404s
 * is skipped instead of failing the batch
 */
async function fetchCatalogEntries<T>([kind, catalogYear, ...names]: [
  "majors" | "minors",
  number,
  ...string[],
]): Promise<T[]> {
  const results: (T | null)[] = await Promise.all(
    names.map(async (name) => {
      const res = await fetch(
        `/api/catalog/${kind}/${catalogYear}/${encodeURIComponent(name)}`,
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return (await res.json()) as T;
    }),
  );
  return results.filter((entry): entry is T => entry !== null);
}

/**
 * Load the given majors requirements on the client. `fallbackData` is shown
 * until the fetch resolves (majors the server already loaded)
 */
export function useMajors(
  catalogYear: number | null | undefined,
  names: string[] | null | undefined,
  fallbackData?: Major[],
) {
  const { data, error, isLoading } = useSWR(
    catalogYear && names?.length
      ? (["majors", catalogYear, ...names] as const)
      : null,
    fetchCatalogEntries<Major>,
    { fallbackData, revalidateOnFocus: false },
  );
  return { majors: data ?? [], error, isLoading };
}

/**
 * Load the given minors requirements on the client. `fallbackData` is shown
 * until the fetch resolves (minors the server already loaded)
 */
export function useMinors(
  catalogYear: number | null | undefined,
  names: string[] | null | undefined,
  fallbackData?: Minor[],
) {
  const { data, error, isLoading } = useSWR(
    catalogYear && names?.length
      ? (["minors", catalogYear, ...names] as const)
      : null,
    fetchCatalogEntries<Minor>,
    { fallbackData, revalidateOnFocus: false },
  );
  return { minors: data ?? [], error, isLoading };
}

export function useSupportedMajors() {
  const [data, setData] = useState<GetSupportedMajorsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const res = await fetch("/api/catalog/majors/supported");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const response: GetSupportedMajorsResponse = await res.json();
        setData(response);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch majors"),
        );
      }
    };

    fetchMajors();
  }, []);

  return { data, error };
}

export function useSupportedMinors() {
  const [data, setData] = useState<GetSupportedMinorsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMinors = async () => {
      try {
        const res = await fetch("/api/catalog/minors/supported");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const response: GetSupportedMinorsResponse = await res.json();
        setData(response);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch minors"),
        );
      }
    };

    fetchMinors();
  }, []);

  return { data, error };
}

export function useHasTemplate(
  majorNames: string[],
  catalogYear: number | null,
) {
  const [hasTemplate, setHasTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!majorNames[0] || !catalogYear) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasTemplate(false);
      return;
    }

    const checkTemplate = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/catalog/templates/${catalogYear}/${encodeURIComponent(majorNames[0])}`,
        );
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const response: Template | null = await res.json();
        if (response == null || response.templateData === null) {
          setHasTemplate(false);
        } else {
          setHasTemplate(true);
        }
      } catch (error) {
        console.error("Error checking template:", error);
        setHasTemplate(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTemplate();
  }, [majorNames, catalogYear]);

  return { hasTemplate, isLoading };
}

export function useTemplate(
  majorNames: string[] | null,
  catalogYear: number | null,
) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!majorNames?.[0] || !catalogYear) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTemplate(null);
      return;
    }

    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/catalog/templates/${catalogYear}/${encodeURIComponent(majorNames[0])}`,
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const response: Template | null = await res.json();
        setTemplate(response);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch template"),
        );
        setTemplate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [majorNames, catalogYear]);

  return { template, isLoading, error };
}
