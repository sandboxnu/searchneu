import {
  SupportedMajors,
  MetaInfo,
  Maybe,
  SupportedMinors,
  ScheduleCourse2,
  ScheduleCourse,
} from "./types";

/** Types our API responds with. */

export class PlanModel<T> {
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

export class StudentModel<T> {
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

export interface GetSupportedMajorsResponse {
  // { year => { majorName => {concentrations, minRequiredConcentrations} }}
  supportedMajors: SupportedMajors;
}

export interface GetSupportedMinorsResponse {
  supportedMinors: SupportedMinors;
}

export interface GetMetaInfoResponse extends MetaInfo {
  commit: Maybe<string>;
  commitMessage: Maybe<string>;
  build_timestamp: Maybe<number>;
  environment: Maybe<string>;
}



