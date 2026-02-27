import { useState, useEffect } from "react";
import { GraduateAPI } from "./graduateApiClient";
import {
  GetSupportedMajorsResponse,
  GetSupportedMinorsResponse,
} from "./api-response-types";
import { Major, Minor, Template } from "./types";

export function useSupportedMajors() {
  const [data, setData] = useState<GetSupportedMajorsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const response = await GraduateAPI.majors.getSupportedMajors();
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
        const response = await GraduateAPI.minors.getSupportedMinors();
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

export function useGraduateMajor(year: string | null, major: string | null) {
  const [data, setData] = useState<Major | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMajor = async () => {
      try {
        const response = await GraduateAPI.majors.get(
          parseInt(year ?? "0"),
          major ?? "",
        );
        setData(response);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch major"),
        );
      }
    };

    fetchMajor();
  }, [year, major]);

  return { majorData: data, error };
}

export function useGraduateMinor(year: string | null, minor: string | null) {
  const [data, setData] = useState<Minor | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMinor = async () => {
      try {
        const response = await GraduateAPI.minors.get(
          parseInt(year ?? "0"),
          minor ?? "",
        );
        setData(response);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch minors"),
        );
      }
    };
    fetchMinor();
  }, [year, minor]);

  return { minorData: data, error };
}

export function useGraduateTemplate(year: string | null, major: string | null) {
  const [data, setData] = useState<Template | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await GraduateAPI.templates.getForMajor(
          parseInt(year ?? "0"),
          major ?? "",
        );
        if (response) {
          setData(response);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch templates"),
        );
      }
    };
    fetchTemplates();
  }, [year, major]);

  return { templatesData: data, error };
}

export function useHasTemplate(
  majorNames?: string[] | null,
  catalogYear?: string | null,
) {
  const [hasTemplate, setHasTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!majorNames?.[0] || !catalogYear) {
      setHasTemplate(false);
      return;
    }

    const checkTemplate = async () => {
      setIsLoading(true);
      try {
        const response = await GraduateAPI.templates.getForMajor(
          parseInt(catalogYear),
          majorNames[0],
        );
        setHasTemplate(!!response);
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
  majorNames?: string[] | null,
  catalogYear?: number | null,
) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!majorNames?.[0] || !catalogYear) {
      setTemplate(null);
      return;
    }

    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const response = await GraduateAPI.templates.getForMajor(
          catalogYear,
          majorNames[0],
        );
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
