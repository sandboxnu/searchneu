import { useState, useEffect } from "react";
import { Template } from "./types";
import {
  GetSupportedMajorsResponse,
  GetSupportedMinorsResponse,
} from "./api-response-types";

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

export function useHasTemplate(majorNames: string[], catalogYear: number) {
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
        console.log(`error when checking template: ${error}`);
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
