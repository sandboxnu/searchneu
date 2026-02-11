import {
  Concentrations,
  IAndCourse,
  ICourseRange,
  IOrCourse,
  IRequiredCourse,
  IXofManyCourse,
  type Major,
  Requirement,
  AuditCourse,
  Section,
} from "../types";
import { assertUnreachable, courseToString } from "./course-utils";
import { MajorValidationTracker } from "./major-validation";

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

// Converts a TestCourse to a AuditCourse
export function convert(c: TestCourse): AuditCourse<unknown> {
  return {
  ...c,
  classId: String(c.classId),
  name: courseToString(c),
  numCreditsMax: c.credits,
  numCreditsMin: c.credits,
  id: null,
  };
}

// Creates an OR requirement
export function or(...courses: Requirement[]): IOrCourse {
  return {
    type: "OR",
    courses,
  };
}

// Creates an AND requirement
export function and(...courses: Requirement[]): IAndCourse {
  return {
  type: "AND",
  courses,
  };
}

// Creates a RANGE requirement
export function range(
  creditsRequired: number,
  subject: string,
  idRangeStart: number,
  idRangeEnd: number,
  exceptions: IRequiredCourse[],
): ICourseRange {
  return {
    type: "RANGE",
    subject,
    idRangeStart,
    idRangeEnd,
    exceptions,
  };
}

// Creates an XOM (X of Many) requirement
export function xom(
  numCreditsMin: number,
  courses: Requirement[],
): IXofManyCourse {
  return {
    type: "XOM",
    numCreditsMin,
    courses,
  };
}

// Creates a Section requirement
export function section(
  title: string,
  minRequirementCount: number,
  requirements: Requirement[],
): { type: "SECTION" } & Section {
  return {
  title,
  requirements,
  minRequirementCount,
  type: "SECTION",
  };
}

// creates a concentration object
export function concentrations (
  minOptions: number,
  ...concentrationOptions: Section[]
): Concentrations {
  return {
    minOptions,
    concentrationOptions,
  };
}

// creates solution
export function solution(...sol: (string | TestCourse)[]) {
  const credits = sol
    .map((c) => (typeof c === "string" ? 4 : c.credits))
    .reduce((total, c) => total + c, 0);
  return {
    minCredits: credits,
    maxCredits: credits,
    sol: sol.map((s) => (typeof s === "string" ? s : courseToString(s))),
  };
};

// makes a MajorValidationTracker with the test courses
export function makeTracker(...courses: TestCourse[]) {
  return new MajorValidationTracker(courses.map(convert));
};

// converts old major to Major
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertToMajor(old: any): Major {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertToSection(r: any): Section {
  switch (r.type) {
    case "AND":
      return {
        type: "SECTION",
        minRequirementCount: r.requirements.length,
        requirements: r.requirements.map(convertToRequirement),
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
            courses: r.requirements.map(convertToRequirement),
          },
        ],
      };
    case "RANGE":
      return {
        type: "SECTION",
        title: r.name,
        minRequirementCount: 1,
        requirements: [convertToRequirement(r.requirements)],
      };
    default:
      return assertUnreachable(r as never);
  }
}

// converts old requirement format to Requirement
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertToRequirement(r: any): Requirement {
  switch (r.type) {
    case "OR":
      return {
        type: "OR",
        courses: r.courses.map(convertToRequirement),
      };
    case "AND":
      return {
        type: "AND",
        courses: r.courses.map(convertToRequirement),
      };
    case "RANGE":
      return {
        type: "XOM",
        numCreditsMin: r.creditsRequired,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        courses: r.courses.map(convertToRequirement),
      };
    default:
      return assertUnreachable(r as never);
  }
}
