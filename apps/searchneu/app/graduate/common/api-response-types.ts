import {
    ScheduleCourse,
    Schedule2,
    SupportedMajors,
    ScheduleCourse2,
    MetaInfo,
    Maybe,
    SupportedMinors,
  } from "./types";
  
  /** Types our API responds with. */
  
  export interface PlanModel<T> {
    id: number;
    name: string;
    student: StudentModel<null>;
    schedule: Schedule2<T>;
    majors: string[];
    concentration: string | undefined;
    catalogYear: number;
    createdAt: Date;
    updatedAt: Date;
    minors?: string[];
  }
  
  export interface GetPlanResponse extends PlanModel<null> {}
  
  export interface UpdatePlanResponse extends PlanModel<null> {}
  
  export interface StudentModel<T> {
    uuid: string | undefined;
    nuid: string | undefined;
    isOnboarded: boolean;
    fullName: string | undefined;
    email: string;
    isEmailConfirmed: boolean;
    academicYear: number | undefined;
    graduateYear: number | undefined;
    catalogYear: number | undefined;
    majors: string[] | undefined;
    minors?: string[] | undefined;
    coopCycle: string | undefined;
    coursesCompleted: ScheduleCourse[] | undefined;
    coursesTransfered: ScheduleCourse2<null>[] | undefined;
    primaryPlanId: number | undefined;
    plans: PlanModel<T>[];
    concentration: string | undefined;
    starredPlan: number | undefined;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface GetStudentResponse extends StudentModel<null> {}
  
  export interface UpdateStudentResponse extends StudentModel<null> {}
  
  export interface GetSupportedMajorsResponse {
    // { year => { majorName => {concentrations, minRequiredConcentrations} }}
    supportedMajors: SupportedMajors;
  }
  export interface GetSupportedMinorsResponse {
    supportedMinors: SupportedMinors;
  }
  
  export interface GetMetaInfoResponse {
    commit: string | undefined;
    commitMessage: string | undefined;
    build_timestamp: number | undefined;
    environment: string | undefined;
  }
  
  export interface SharePlanResponse {
    planCode: string;
    url: string;
    expiresAt: string;
  }
  