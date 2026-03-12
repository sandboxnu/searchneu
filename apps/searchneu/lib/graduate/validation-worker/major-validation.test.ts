import {
  AndErrorNoSolution,
  AndErrorUnsatChild,
  AndErrorUnsatChildAndNoSolution,
  ChildError,
  CourseError,
  getConcentrationsRequirement,
  MajorValidationError,
  MajorValidationResult,
  SectionError,
  TotalCreditsRequirementError,
  validateMajor,
  validateRequirement,
} from "./major-validation";
import { type Major, Section, Err, Ok, ResultType } from "../types";
import {
  course,
  convert,
  or,
  and,
  range,
  xom,
  section,
  solution,
  concentrations,
  makeTracker,
  convertToMajor,
} from "./test-utils";
import bscs from "./mock-majors/bscs.json";
import { test, describe } from "node:test";
import assert from "node:assert";
import {
  cs2810,
  cs3950,
  cs4805,
  cs4810,
  cs4830,
  cs4820,
  cs4950,
  ds3000,
  cy4770,
  cs1200,
  cs1210,
  cs1800,
  cs1802,
  cs2500,
  cs2501,
  cs2510,
  cs2511,
  cs2800,
  cs2801,
  cs3000,
  cs3500,
  cs3650,
  cs3700,
  cs3800,
  cs4400,
  cs4500,
  cs4501,
  thtr1170,
  cs4410,
  cs2550,
  ds4300,
  cs4300,
  math1341,
  math1342,
  math2331,
  math3081,
  phil1145,
  eece2160,
  chem1211,
  chem1212,
  chem1213,
  chem1214,
  chem1215,
  chem1216,
  phys1151,
  phys1152,
  phys1153,
  phys1155,
  phys1156,
  phys1157,
  engw1111,
  engw3302,
  cs1990,
  hist1130,
  math2321,
  honr1310,
  math3527,
  artg1250,
  artg2400,
} from "./mock-courses";

const child = (error: MajorValidationError, index: number): ChildError => {
  return {
    childIndex: index,
    ...error,
  };
};

describe("validateRequirement suite", () => {
  // (CS2810 or CS2800) and (CS2810 or DS3000)
  const cs2810orcs2800 = or(cs2810, cs2800);
  const cs2810ords3000 = or(cs2810, ds3000);
  const cs2000tocs3000 = range(8, "CS", 2000, 3000, []);
  const rangeException = range(4, "CS", 2000, 4000, [cs2810]);
  const xom8credits = xom(8, [cs2800, cs2810, ds3000]);
  const xom4credits = xom(4, [cs2500, cs2501]);
  const xom4creditsWrongOrder = xom(4, [cs2501, cs2500]);
  const input = and(cs2810orcs2800, cs2810ords3000);
  const tracker = makeTracker(cs2800, cs2810, ds3000, cs3500);
  const xomTracker = makeTracker(cs2500, cs2501);
  test("or 1", () => {
    assert.deepEqual(
      validateRequirement(cs2810orcs2800, tracker),
      Ok([solution("CS2810"), solution("CS2800")]),
    );
  });
  test("or 2", () => {
    assert.deepEqual(
      validateRequirement(cs2810ords3000, tracker),
      Ok([solution("CS2810"), solution("DS3000")]),
    );
  });

  test("and of ors", () => {
    assert.deepStrictEqual(
      validateRequirement(input, tracker),
      Ok([
        // (CS2810 or CS2800) and (CS2810 or DS3000)
        solution("CS2810", "DS3000"),
        solution("CS2800", "CS2810"),
        solution("CS2800", "DS3000"),
      ]),
    );
  });
  test("and no solutions", () => {
    assert.deepStrictEqual(
      validateRequirement(
        and(and(cs2810, cs2800), and(cs2810, cs2800)),
        tracker,
      ),
      Err(AndErrorNoSolution(1)),
    );
  });
  test("range of courses", () => {
    assert.deepStrictEqual(
      validateRequirement(cs2000tocs3000, tracker),
      Ok([solution(cs2800), solution("CS2800", "CS2810"), solution(cs2810)]),
    );
  });
  test("range of courses with exception", () => {
    assert.deepStrictEqual(
      validateRequirement(rangeException, tracker),
      Ok([solution("CS2800"), solution(cs2800, cs3500), solution("CS3500")]),
    );
  });
  test("XOM requirement", () => {
    assert.deepStrictEqual(
      validateRequirement(xom8credits, tracker),
      Ok([
        solution("CS2800", "CS2810"),
        solution("CS2800", "DS3000"),
        solution("CS2810", "DS3000"),
      ]),
    );
  });
  test("XOM requirement without duplicates", () => {
    assert.deepStrictEqual(
      validateRequirement(xom4credits, xomTracker),
      Ok([solution("CS2500")]),
    );
  });
  test("XOM requirement without duplicates in wrong order", () => {
    assert.deepStrictEqual(
      validateRequirement(xom4creditsWrongOrder, xomTracker),
      Ok([solution(cs2501, cs2500), solution("CS2500")]),
    );
  });
  const foundations = section("Foundations", 2, [
    xom(8, [or(and(cs2800, cs2801), cs4820), or(cs4805, cs4810)]),
    xom(8, [
      cs4805,
      cs4810,
      cs4820,
      cs4830,
      and(cs3950, cs4950, cs4950),
      cy4770,
    ]),
  ]);
  const foundationsCourses1 = makeTracker(
    cs2801,
    cs2800,
    cs4810,
    cs4805,
    cs3950,
    cs4950,
    cs4950,
  );
  test("integration", () => {
    assert.deepStrictEqual(
      validateRequirement(foundations, foundationsCourses1),
      Ok([
        solution(cs2800, cs2801, cs4810, cs4805, cs3950, cs4950, cs4950),
        solution(cs2800, cs2801, cs4805, cs4810, cs3950, cs4950, cs4950),
      ]),
    );
  });

  test("section", () => {
    const tracker = makeTracker(cs2800, cs2810);
    const r = section("s1", 2, [cs2800, cs2810, cs3500]);
    assert.deepStrictEqual(
      validateRequirement(r, tracker),
      Ok([solution(cs2800, cs2810)]),
    );
  });
  test("range allows duplicates", () => {
    const tracker = makeTracker(cs2800, cs2800);
    const r = range(8, "CS", 2000, 3000, []);
    assert.deepStrictEqual(
      validateRequirement(r, tracker),
      Ok([solution(cs2800), solution(cs2800, cs2800), solution(cs2800)]),
    );
  });
  test("concentrations", () => {
    const twoConcentrations = concentrations(
      2,
      section("1", 1, [cs2800]),
      section("2", 1, [cs2810]),
      section("3", 1, [ds3000]),
    );
    assert.deepStrictEqual(
      validateRequirement(
        getConcentrationsRequirement([1, "3"], twoConcentrations)[0],
        tracker,
      ),
      Ok([solution(cs2810, ds3000)]),
    );
  });
});

describe("integration suite", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bscs2 = convertToMajor(bscs as any);
  const taken = [
    cs1200,
    cs1210,
    cs1800,
    cs1802,
    cs2500,
    cs2501,
    cs2510,
    cs2511,
    cs2800,
    cs2801,
    cs3000,
    cs3500,
    cs3650,
    cs3700,
    cs3800,
    cs4400,
    cs4500,
    cs4501,
    cs4410,
    cs2550,
    ds4300,
    cs1990,
    cs1990,
    thtr1170,
    math1341,
    math1342,
    math2331,
    math3081,
    phil1145,
    eece2160,
    phys1151,
    phys1152,
    phys1153,
    phys1155,
    phys1156,
    phys1157,
    engw1111,
    engw3302,
    hist1130,
    math2321,
    honr1310,
    math3527,
    artg1250,
    artg2400,
  ];
  const tracker = makeTracker(...taken);
  const scheduleCourses = taken.map(convert);
  for (const r of bscs2.requirementSections) {
    test(r.title, () => {
      validateRequirement(r, tracker);
    });
  }
  test("alex's full major", () => {
    const actual = validateMajor(bscs2, scheduleCourses);
    const expected = [
      solution(
        cs1200,
        cs1210,
        cs1800,
        cs1802,
        cs2500,
        cs2501,
        cs2510,
        cs2511,
        cs2800,
        cs2801,
        cs3000,
        cs3500,
        cs3650,
        cs3700,
        cs3800,
        cs4400,
        cs4500,
        cs4501,
        thtr1170,
        cs4410,
        cs2550,
        ds4300,
        math1341,
        math1342,
        math2331,
        math3081,
        phil1145,
        eece2160,
        phys1151,
        phys1152,
        phys1153,
        phys1155,
        phys1156,
        phys1157,
        engw1111,
        engw3302,
      ),
    ];
    assert.deepStrictEqual(actual, Ok(expected));
    assert.ok(taken.length > expected.length);
  });
  test("cindy's full major", () => {
    const taken = [
      cs1200,
      cs1800,
      cs1802,
      cs2500,
      cs2501,
      engw1111,
      cs2510,
      cs2511,
      cs2810,
      cs2800,
      cs2801,
      cs3500,
      math3081,
      math1341,
      math1342,
      math2331,
      cs1210,
      cs3000,
      cs3650,
      thtr1170,
      engw3302,
      chem1211,
      chem1212,
      chem1213,
      chem1214,
      chem1215,
      chem1216,
      cs3700,
      cs3800,
      phil1145,
      phys1151,
      phys1152,
      phys1153,
      phys1155,
      phys1156,
      phys1157,
      ds3000,
      cs4400,
      cs4500,
      cs4501,
      cs4300,
      eece2160,
    ];
    const baseClasses = [
      cs1200,
      cs1210,
      cs1800,
      cs1802,
      cs2500,
      cs2501,
      cs2510,
      cs2511,
      cs2800,
      cs2801,
      cs3000,
      cs3500,
      cs3650,
      cs3700,
      cs3800,
      cs4400,
      cs4500,
      cs4501,
      thtr1170,
      cs4300,
      cs2810,
      ds3000,
      math1341,
      math1342,
      math2331,
      math3081,
      phil1145,
      eece2160,
    ];
    const engReqs = [engw1111, engw3302];
    const physReqs = [
      phys1151,
      phys1152,
      phys1153,
      phys1155,
      phys1156,
      phys1157,
    ];
    const chemReqs = [
      chem1211,
      chem1212,
      chem1213,
      chem1214,
      chem1215,
      chem1216,
    ];
    const expectedWithChem = solution(...baseClasses, ...chemReqs, ...engReqs);
    const expectedWithPhys = solution(...baseClasses, ...physReqs, ...engReqs);
    const scheduleCourses = taken.map(convert);
    const actual = validateMajor(bscs2, scheduleCourses);
    assert.deepStrictEqual(actual, Ok([expectedWithChem, expectedWithPhys]));
  });
});

const MajorErr = (
  reqsError?: MajorValidationError,
  creditsError?: TotalCreditsRequirementError,
): MajorValidationResult => {
  return {
    err: {
      majorRequirementsError: reqsError,
      totalCreditsRequirementError: creditsError,
    },
    type: ResultType.Err,
  };
};

const Major = (
  requirementSections: Section[],
  name = "Demo Major",
  yearVersion = 0,
  totalCreditsRequired = 0,
): Major => {
  return {
    name: name,
    totalCreditsRequired: totalCreditsRequired,
    yearVersion: yearVersion,
    requirementSections: requirementSections,
    concentrations: {
      minOptions: 0,
      concentrationOptions: [],
    },
  };
};

describe("NoSolution and UnsatChild", () => {
  const capstone = section("Capstone", 1, [
    or(course("CS", 4100), course("CS", 4300)),
  ]);
  const elective = section("Elective", 1, [
    xom(8, [
      range(0, "CS", 2500, 5010, []),
      range(0, "DS", 2000, 4900, []),
      range(0, "IS", 2000, 4900, []),
    ]),
  ]);
  const presentation = section("Presentation", 1, [course("THTR", 1170)]);

  const base = Major([capstone, elective, presentation]);
  const courses = [course("CS", 4100), course("CS", 4300)];
  const convertedCourses = courses.map(convert);
  // Helper to wrap errors - validateMajor wraps requirements in an extra AND
  const wrapInAnd = (error: MajorValidationError): MajorValidationError =>
    ({
      type: "AND" as const,
      error: {
        type: "AND_UNSAT_CHILD" as const,
        childErrors: [{ childIndex: 0, ...error }],
      },
    }) as MajorValidationError;

  // Former bug case
  test("Base Case", () => {
    const actual = validateMajor(base, convertedCourses);
    assert.deepStrictEqual(
      actual,
      MajorErr(
        wrapInAnd(
          AndErrorUnsatChildAndNoSolution(
            [
              child(
                SectionError(presentation, [courseErr("THTR", 1170, 0)], 0),
                2,
              ),
            ],
            1,
          ),
        ),
      ),
    );
  });

  // All indices should stay the same
  const order1 = Major([elective, capstone, presentation]);
  test("Order Change 1", () => {
    const actual = validateMajor(order1, convertedCourses);
    assert.deepStrictEqual(
      actual,
      MajorErr(
        wrapInAnd(
          AndErrorUnsatChildAndNoSolution(
            [
              child(
                SectionError(presentation, [courseErr("THTR", 1170, 0)], 0),
                2,
              ),
            ],
            1,
          ),
        ),
      ),
    );
  });

  // UnSat and NoSolution index change.
  const order2 = Major([presentation, elective, capstone]);
  test("Order Change 2", () => {
    const actual = validateMajor(order2, convertedCourses);
    assert.deepStrictEqual(
      actual,
      MajorErr(
        wrapInAnd(
          AndErrorUnsatChildAndNoSolution(
            [
              child(
                SectionError(presentation, [courseErr("THTR", 1170, 0)], 0),
                0,
              ),
            ],
            2,
          ),
        ),
      ),
    );
  });

  // If there are enough courses for both, no NoSolution
  const enough = [
    course("CS", 4100),
    course("CS", 4300),
    course("CS", 4410),
  ].map(convert);
  test("Enough Courses", () => {
    const actual = validateMajor(base, enough);
    assert.deepStrictEqual(
      actual,
      MajorErr(
        wrapInAnd(
          AndErrorUnsatChild([
            child(
              SectionError(presentation, [courseErr("THTR", 1170, 0)], 0),
              2,
            ),
          ]),
        ),
      ),
    );
  });
});

const courseErr = (
  subject: string,
  courseNum: number,
  childIndex: number,
): ChildError => {
  return child(CourseError(course(subject, courseNum)), childIndex);
};
