import Axios from "axios";
import { GetMetaInfoResponse, GetPlanResponse, GetStudentResponse, GetSupportedMajorsResponse, GetSupportedMinorsResponse, SharePlanResponse, UpdatePlanResponse, UpdateStudentResponse } from "./common/api-response-types";
import { Major2, Minor, ParsedCourse } from "./common/types";
import { ChangePasswordDto, CreatePlanDto, CreatePlanShareDto, OnboardStudentDto, UpdatePlanDto, UpdateStudentDto } from "./common/api-dtos";

class GraduateAPIClient {
  private axios: any;
  private baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL ?? (
      process.env.NODE_ENV === 'development' 
        ? '/api/graduate-api'
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
    
    get: (catalogYear: number, majorName: string): Promise<Major2> =>
      this.req("GET", `/majors/${catalogYear}/${majorName}`),
  };

  minors = {
    get: (catalogYear: number, minorName: string): Promise<Minor> =>
      this.req("GET", `/minors/${catalogYear}/${minorName}`),
    
    getSupportedMinors: (): Promise<GetSupportedMinorsResponse> =>
      this.req("GET", "/minors/supportedMinors"),
  };

  templates = {
    getForYear: (catalogYear: number): Promise<Record<string, Major2>> =>
      this.req("GET", `/templates/${catalogYear}`),
    
    getForMajor: (majorName: string, catalogYear: number): Promise<Major2 | null> =>
      this.req("GET", `/templates/${catalogYear}/${majorName}`),
    
    getAll: (): Promise<Record<string, Record<string, Major2>>> =>
      this.req("GET", "/templates"),
  };
  
  student = {
    getMe: (): Promise<GetStudentResponse> =>
      this.req("GET", "/students/me"),
    
    getMeWithPlan: (): Promise<GetStudentResponse> =>
      this.req("GET", "/students/me", undefined, { isWithPlans: true }),
    
    update: (body: UpdateStudentDto): Promise<UpdateStudentResponse> =>
      this.req("PATCH", "/students/me", body),
    
    onboard: (body: OnboardStudentDto): Promise<UpdateStudentResponse> =>
      this.req("PATCH", "/students/me/onboard", body),
    
    delete: (): Promise<void> =>
      this.req("DELETE", "/students/me"),
    
    changePassword: (body: ChangePasswordDto): Promise<void> =>
      this.req("POST", "/students/changePassword", body),
  };

  plans = {
    create: (body: CreatePlanDto): Promise<GetPlanResponse> =>
      this.req("POST", "/plans", body),
    
    get: (id: string | number): Promise<GetPlanResponse> =>
      this.req("GET", `/plans/${id}`),
    
    update: (id: string | number, body: UpdatePlanDto): Promise<UpdatePlanResponse> =>
      this.req("PATCH", `/plans/${id}`, body),
    
    delete: (id: string | number): Promise<void> =>
      this.req("DELETE", `/plans/${id}`),
    
    share: (body: CreatePlanShareDto): Promise<SharePlanResponse> =>
      this.req("POST", "/plans/share", body),
    
    viewSharedPlan: (code: string): Promise<SharePlanResponse> =>
      this.req("GET", `/plans/share/view/${code}`),
  };

  utils = {
    parsePdfCourses: (file: File): Promise<ParsedCourse[]> => {
      const formData = new FormData();
      formData.append("pdf", file);

      return this.req(
        "POST",
        "/utils/parse-pdf-courses",
        formData,
        undefined
      );
    },
  };
}

export const GraduateAPI = new GraduateAPIClient();