import { useState, useEffect } from "react";
import { GraduateAPI } from "./graduateApiClient";
import { GetSupportedMajorsResponse } from "./api-response-types";

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
