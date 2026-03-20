// WIP; TODO: further types to be added to this file in a future ticket

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
  name: string;
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
