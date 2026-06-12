// WIP; TODO: further types to be added to this file in a future ticket

import { Course } from "../catalog/types";

export interface PlanCourse {
  courseId: number;
  isLocked: boolean;
  sections: PlanSection[];
}

export interface PlanSection {
  sectionId: number;
  isHidden: boolean;
}

export interface PlanData {
  id: number;
  name: string;
  termId: number;
  startTime?: number;
  endTime?: number;
  freeDays?: string[];
  includeHonorsSections?: boolean;
  includeRemoteSections?: boolean;
  hideFilledSections?: boolean;
  numCourses?: number;
  campus?: number;
  nupaths?: number[];
  courses?: PlanCourse[];
  favoritedSchedules?: FavoritedSchedule[];
}

interface FavoritedSchedule {
  id: number;
  sections: { sectionId: number }[];
}

export interface PlanUpdateData {
  startTime?: number | null;
  endTime?: number | null;
  freeDays: number[];
  includeHonorsSections: boolean;
  includeRemoteSections: boolean;
  hideFilledSections: boolean;
  nupaths: number[];
  numCourses?: number;
  campus?: number | null;
  courses?: {
    courseId: number;
    isLocked: boolean;
    sections: { sectionId: number; isHidden: boolean }[];
  }[];
}

export type CourseIdentifier = Pick<Course, "subjectCode" | "courseNumber">;

export type ModalCourse = Pick<
  Course,
  "id" | "subjectCode" | "courseNumber" | "name" | "coreqs"
>;

export type SelectedCourseGroupData = {
  parent: ModalCourse;
  coreqs: ModalCourse[];
};

export type CourseReq = {
  subject?: string;
  courseNumber?: string;
  type?: string;
  items?: CourseReq[];
};

export interface ExistingPlanData {
  courses: Array<{
    courseId: number;
    isLocked: boolean;
    sections: Array<{
      sectionId: number;
      isHidden: boolean;
    }>;
  }>;
  numCourses?: number;
}
