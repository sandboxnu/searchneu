// dto-types.ts
import { Schedule2, ScheduleCourse } from "./types";

export interface CreatePlanDto {
  name: string;
  majors?: string[];
  minors?: string[];
  concentration?: string;
  catalogYear?: number;
  schedule: Schedule2<null>;
  agreeToBetaMajor?: boolean;
}

export interface UpdatePlanDto {
  name?: string;
  schedule?: Schedule2<null>;
  majors?: string[];
  minors?: string[];
  concentration?: string;
  catalogYear?: number;
}

export interface SignUpStudentDto {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface UpdateStudentDto {
  fullName?: string;
  nuid?: string;
  email?: string;
  academicYear?: number;
  graduateYear?: number;
  catalogYear?: number;
  majors?: string[];
  minors?: string[];
  coopCycle?: string;
  coursesCompleted?: ScheduleCourse[];
  coursesTransfered?: ScheduleCourse[];
  primaryPlanId?: number;
  concentration?: string;
  isOnboarded?: boolean;
  starredPlan?: number;
}

export interface OnboardStudentDto {
  fullName: string;
  nuid: string;
  academicYear: number;
  graduateYear: number;
  catalogYear: number;
  majors: string[];
  minors: string[];
  coopCycle: string;
  coursesCompleted: ScheduleCourse[];
  coursesTransfered: ScheduleCourse[];
  primaryPlanId: number;
  concentration: string;
}

export interface LoginStudentDto {
  email: string;
  password: string;
}

export interface ConfirmEmailDto {
  token: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  passwordConfirm: string;
}

export interface CreatePlanShareDto {
  planJson: Record<string, any>;
  expiresInDays?: number;
}