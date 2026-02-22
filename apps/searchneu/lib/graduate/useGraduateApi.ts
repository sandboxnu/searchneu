import { useState, useEffect } from "react";
import { GraduateAPI } from "./graduateApiClient";
import { GetSupportedMajorsResponse } from "./api-response-types";
import { Major, Minor } from "./types";

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
  const [data, setData] = useState<Record<string, Major> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await GraduateAPI.templates.getForMajor(
          parseInt(year ?? "0"),
          major ?? "",
        );
        if (response) {
          setData({ [major ?? ""]: response });
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
