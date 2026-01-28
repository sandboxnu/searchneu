import Axios from "axios";
import { GetMetaInfoResponse, GetSupportedMajorsResponse, GetSupportedMinorsResponse } from "../../../lib/graduate/api-response-types";
import { Major, Minor } from "../../../lib/graduate/types";

class GraduateAPIClient {
  private axios: any;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL ?? (
      process.env.NODE_ENV === 'development' 
        ? '/api/graduate'
        : 'https://api.graduatenu.com/api' 
    );
    this.axios = Axios.create({
      baseURL: this.baseURL,
      headers: { "content-type": "application/json" },
      withCredentials: true,
    });
  }

  private async req<T>(
    method: string,
    url: string,
    body?: any,
    params?: any
  ): Promise<T> {
    const res = await this.axios.request({
      method,
      url,
      data: body,
      params,
    });
    return res.data;
  }

  meta = {
    getInfo: (): Promise<GetMetaInfoResponse> =>
      this.req("GET", "/meta/info"),
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
    
    getForMajor: (majorName: string, catalogYear: number): Promise<Major | null> =>
      this.req("GET", `/templates/${catalogYear}/${majorName}`),
    
    getAll: (): Promise<Record<string, Record<string, Major>>> =>
      this.req("GET", "/templates"),
  };
}

export const GraduateAPI = new GraduateAPIClient();