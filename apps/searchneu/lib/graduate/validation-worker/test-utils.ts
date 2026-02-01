import {
  Concentrations2,
  IAndCourse2,
  ICourseRange2,
  IOrCourse2,
  IRequiredCourse,
  IXofManyCourse,
  type Major2,
  Requirement2,
  ScheduleCourse2,
  Section,
} from "../types";
import { assertUnreachable, courseToString } from "./course-utils";
import { Major2ValidationTracker } from "./major2-validation";


export type TestCourse = IRequiredCourse & { credits: number };

// Creates a test course with optional credit hours
export const course = (
  subject: string,
  classId: number,
  credits?: number,
): TestCourse => ({
  subject,
  type: "COURSE",
  classId: classId,
  credits: credits ?? 4,
});


// Converts a TestCourse to a ScheduleCourse2
export const convert = (c: TestCourse): ScheduleCourse2<unknown> => ({
  ...c,
  classId: String(c.classId),
  name: courseToString(c),
  numCreditsMax: c.credits,
  numCreditsMin: c.credits,
  id: null,
});

// Creates an OR requirement
export const or = (...courses: Requirement2[]): IOrCourse2 => ({
  type: "OR",
  courses,
});


// Creates an AND requirement
export const and = (...courses: Requirement2[]): IAndCourse2 => ({
  type: "AND",
  courses,
});


// Creates a RANGE requirement
export const range = (
  creditsRequired: number,
  subject: string,
  idRangeStart: number,
  idRangeEnd: number,
  exceptions: IRequiredCourse[],
): ICourseRange2 => ({
  type: "RANGE",
  subject,
  idRangeStart,
  idRangeEnd,
  exceptions,
});


// Creates an XOM (X of Many) requirement
export const xom = (
  numCreditsMin: number,
  courses: Requirement2[],
): IXofManyCourse => ({
  type: "XOM",
  numCreditsMin,
  courses,
});


// Creates a Section requirement
export const section = (
  title: string,
  minRequirementCount: number,
  requirements: Requirement2[],
): { type: "SECTION" } & Section => ({
  title,
  requirements,
  minRequirementCount,
  type: "SECTION",
});

// creates a concentration object
export const concentrations = (
  minOptions: number,
  ...concentrationOptions: Section[]
): Concentrations2 => ({
  minOptions,
  concentrationOptions,
});



// creates solution
export const solution = (...sol: (string | TestCourse)[]) => {
  const credits = sol
    .map((c) => (typeof c === "string" ? 4 : c.credits))
    .reduce((total, c) => total + c, 0);
  return {
    minCredits: credits,
    maxCredits: credits,
    sol: sol.map((s) => (typeof s === "string" ? s : courseToString(s))),
  };
};


// makes a Major2ValidationTracker with the test courses
export const makeTracker = (...courses: TestCourse[]) => {
  return new Major2ValidationTracker(courses.map(convert));
};


// converts old major to Major2
export function convertToMajor2(old: any): Major2 {
  return {
    name: old.name,
    totalCreditsRequired: old.totalCreditsRequired,
    yearVersion: old.yearVersion,
    requirementSections: Object.values(old.requirementGroupMap).map(
      convertToSection,
    ),
    concentrations: {
      minOptions: old.concentrations.minOptions,
      concentrationOptions: old.concentrations.concentrationOptions.map(
        (c: any) => ({
          type: "SECTION",
          title: c.name,
          minRequirementCount: c.requirementGroups.length,
          requirements: Object.values(c.requirementGroupMap).map(
            convertToSection,
          ),
        }),
      ),
    },
  };
}


// converts old requirement to section
export function convertToSection(r: any): Section {
  switch (r.type) {
    case "AND":
      return {
        type: "SECTION",
        minRequirementCount: r.requirements.length,
        requirements: r.requirements.map(convertToRequirement2),
        title: r.name,
      };
    case "OR":
      return {
        type: "SECTION",
        title: r.name,
        minRequirementCount: 1,
        requirements: [
          {
            type: "XOM",
            numCreditsMin: r.numCreditsMin,
            courses: r.requirements.map(convertToRequirement2),
          },
        ],
      };
    case "RANGE":
      return {
        type: "SECTION",
        title: r.name,
        minRequirementCount: 1,
        requirements: [convertToRequirement2(r.requirements)],
      };
    default:
      return assertUnreachable(r as never);
  }
}

// converts old requirement format to Requirement2
export function convertToRequirement2(r: any): Requirement2 {
  switch (r.type) {
    case "OR":
      return {
        type: "OR",
        courses: r.courses.map(convertToRequirement2),
      };
    case "AND":
      return {
        type: "AND",
        courses: r.courses.map(convertToRequirement2),
      };
    case "RANGE":
      return {
        type: "XOM",
        numCreditsMin: r.creditsRequired,
        courses: r.ranges.map((r: any) => ({
          type: "RANGE",
          exceptions: [],
          idRangeStart: r.idRangeStart,
          idRangeEnd: r.idRangeEnd,
          subject: r.subject,
        })),
      };
    case "COURSE":
      return r;
    case "CREDITS":
      return {
        type: "XOM",
        numCreditsMin: r.minCredits,
        courses: r.courses.map(convertToRequirement2),
      };
    default:
      return assertUnreachable(r as never);
  }
}