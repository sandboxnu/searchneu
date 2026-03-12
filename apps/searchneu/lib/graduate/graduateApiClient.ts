import {
  GetMetaInfoResponse,
  GetSupportedMajorsResponse,
  GetSupportedMinorsResponse,
} from "./api-response-types";
import { Major, Minor, Template } from "./types";

class GraduateAPIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async req<T>(
    method: string,
    url: string,
    body?: unknown,
    params?: Record<string, string | number>,
  ): Promise<T> {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const fullUrl = new URL(`${this.baseURL}${url}`, base);

    if (params) {
      Object.keys(params).forEach((key) =>
        fullUrl.searchParams.append(key, String(params[key])),
      );
    }

    const response = await fetch(fullUrl.toString(), {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  meta = {
    getInfo: (): Promise<GetMetaInfoResponse> => this.req("GET", "/meta/info"),
  };

  majors = {
    getSupportedMajors: (): Promise<GetSupportedMajorsResponse> =>
      this.req("GET", "/majors/supportedMajors"),

    get: (catalogYear: number, majorName: string): Promise<Major> =>
      this.req("GET", `/majors/${catalogYear}/${majorName}`),
  };

  minors = {
    get: (catalogYear: number, minorName: string): Promise<Minor> =>
      this.req("GET", `/minors/${catalogYear}/${minorName}`),

    getSupportedMinors: (): Promise<GetSupportedMinorsResponse> =>
      this.req("GET", "/minors/supportedMinors"),
  };

  templates = {
    getForYear: (catalogYear: number): Promise<Record<string, Major>> =>
      this.req("GET", `/templates/${catalogYear}`),

    getForMajor: (
      catalogYear: number,
      majorName: string,
    ): Promise<Template | null> =>
      this.req("GET", `/templates/${catalogYear}/${majorName}`),

    getAll: (): Promise<Record<string, Record<string, Major>>> =>
      this.req("GET", "/templates"),
  };
}

export const GraduateAPI = new GraduateAPIClient(
  process.env.NEXT_PUBLIC_GRADUATE_API_URL ?? "/api/graduate",
);
