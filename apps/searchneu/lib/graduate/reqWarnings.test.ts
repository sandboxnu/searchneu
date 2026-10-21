import { test } from "node:test";
import assert from "node:assert/strict";
import type { Requisite, RequisiteItem } from "@sneu/scraper/types";
import { getCoreqWarnings, getPrereqWarnings } from "./reqWarnings";
import {
  Audit,
  AuditCourse,
  AuditWarnings,
  AuditYear,
  ReqErrorType,
  SeasonEnum,
  StatusEnum,
} from "./types";

type TestCourse = {
  subject: string;
  classId: string;
  prereqs?: Requisite;
  coreqs?: Requisite;
};

const course = (c: TestCourse): AuditCourse => ({
  name: "",
  numCreditsMin: 4,
  numCreditsMax: 4,
  id: null,
  ...c,
});

const term = (season: SeasonEnum, classes: TestCourse[] = []) => ({
  season,
  status: StatusEnum.CLASSES,
  id: null,
  classes: classes.map(course),
});

const year = (
  num: number,
  terms: {
    fall?: TestCourse[];
    spring?: TestCourse[];
    summer1?: TestCourse[];
    summer2?: TestCourse[];
  } = {},
): AuditYear => ({
  year: num,
  fall: term(SeasonEnum.FL, terms.fall),
  spring: term(SeasonEnum.SP, terms.spring),
  summer1: term(SeasonEnum.S1, terms.summer1),
  summer2: term(SeasonEnum.S2, terms.summer2),
  isSummerFull: false,
});

const req = (subject: string, courseNumber: string) => ({
  subject,
  courseNumber,
});
const and = (...items: RequisiteItem[]) => ({ type: "and" as const, items });
const or = (...items: RequisiteItem[]) => ({ type: "or" as const, items });
const missing = (subject: string, classId: string) => ({
  type: ReqErrorType.COURSE,
  subject,
  classId,
});

/** Every warning in a result, flattened to "year/term/course" → error. */
const allWarnings = (warnings: AuditWarnings) => {
  const out: Record<string, unknown> = {};
  for (const y of warnings.years) {
    for (const t of ["fall", "spring", "summer1", "summer2"] as const) {
      for (const [key, error] of Object.entries(y[t])) {
        out[`${y.year}/${t}/${key}`] = error;
      }
    }
  }
  return out;
};

const CS2510 = { subject: "CS", classId: "2510" };
const CS2500 = { subject: "CS", classId: "2500" };

test("courses with no reqs produce no warnings", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [
          CS2500,
          { ...CS2510, prereqs: {}, coreqs: {} },
          { subject: "MATH", classId: "1341", prereqs: or(), coreqs: and() },
        ],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {});
  assert.deepEqual(allWarnings(getCoreqWarnings(schedule)), {});
});

test("result has one empty entry per year", () => {
  const warnings = getPrereqWarnings({ years: [year(1), year(2)] });
  assert.equal(warnings.type, "prereq");
  assert.deepEqual(warnings.years, [
    { year: 1, fall: {}, spring: {}, summer1: {}, summer2: {} },
    { year: 2, fall: {}, spring: {}, summer1: {}, summer2: {} },
  ]);
});

test("single-course prereq met in an earlier term", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [CS2500],
        spring: [{ ...CS2510, prereqs: req("CS", "2500") }],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {});
});

test("single-course prereq not in the plan is unmet", () => {
  const schedule: Audit = {
    years: [year(1, { spring: [{ ...CS2510, prereqs: req("CS", "2500") }] })],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {
    "1/spring/CS 2510": missing("CS", "2500"),
  });
});

test("prereq in the same term counts as unmet", () => {
  const schedule: Audit = {
    years: [
      year(1, { fall: [CS2500, { ...CS2510, prereqs: req("CS", "2500") }] }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {
    "1/fall/CS 2510": missing("CS", "2500"),
  });
});

test("prereq scheduled in a later term is unmet", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [{ ...CS2510, prereqs: req("CS", "2500") }],
        spring: [CS2500],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {
    "1/fall/CS 2510": missing("CS", "2500"),
  });
});

test("coreq in the same term is met", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [
          { ...CS2500, coreqs: req("CS", "2501") },
          { subject: "CS", classId: "2501" },
        ],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getCoreqWarnings(schedule)), {});
});

test("coreq in a different term is unmet", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [{ ...CS2500, coreqs: req("CS", "2501") }],
        spring: [{ subject: "CS", classId: "2501" }],
      }),
    ],
  };
  const warnings = getCoreqWarnings(schedule);
  assert.equal(warnings.type, "coreq");
  assert.deepEqual(allWarnings(warnings), {
    "1/fall/CS 2500": missing("CS", "2501"),
  });
});

test("or is satisfied by any one branch", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [CS2500],
        spring: [
          { ...CS2510, prereqs: or(req("CS", "1800"), req("CS", "2500")) },
        ],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {});
});

test("and reports only its missing pieces", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [CS2500],
        spring: [
          {
            ...CS2510,
            prereqs: and(
              req("CS", "2500"),
              req("CS", "1800"),
              req("MATH", "1341"),
            ),
          },
        ],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {
    "1/spring/CS 2510": {
      type: ReqErrorType.AND,
      missing: [missing("CS", "1800"), missing("MATH", "1341")],
    },
  });
});

test("an and/or with one missing piece collapses to that piece", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [CS2500],
        spring: [
          { ...CS2510, prereqs: and(req("CS", "2500"), req("CS", "1800")) },
        ],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {
    "1/spring/CS 2510": missing("CS", "1800"),
  });
});

test("unmet or lists every branch, easiest first", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        spring: [
          {
            ...CS2510,
            prereqs: or(
              and(req("CS", "2500"), req("CS", "2501")),
              req("CS", "1800"),
            ),
          },
        ],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {
    "1/spring/CS 2510": {
      type: ReqErrorType.OR,
      missing: [
        missing("CS", "1800"),
        {
          type: ReqErrorType.AND,
          missing: [missing("CS", "2500"), missing("CS", "2501")],
        },
      ],
    },
  });
});

test("nested and inside or only lists what that branch still needs", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [CS2500],
        spring: [
          {
            ...CS2510,
            prereqs: or(
              and(req("CS", "2500"), req("CS", "2501")),
              req("CS", "1800"),
            ),
          },
        ],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {
    "1/spring/CS 2510": {
      type: ReqErrorType.OR,
      missing: [missing("CS", "2501"), missing("CS", "1800")],
    },
  });
});

test("nested ors are flattened", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        spring: [
          {
            ...CS2510,
            prereqs: or(
              req("CS", "2500"),
              or(req("CS", "1800"), req("DS", "2000")),
            ),
          },
        ],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {
    "1/spring/CS 2510": {
      type: ReqErrorType.OR,
      missing: [
        missing("CS", "2500"),
        missing("CS", "1800"),
        missing("DS", "2000"),
      ],
    },
  });
});

test("exam items count as satisfied", () => {
  const exam = { name: "AP Computer Science A", score: 4 };
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [
          { ...CS2500, prereqs: exam },
          { ...CS2510, prereqs: or(req("CS", "1800"), exam) },
          {
            subject: "MATH",
            classId: "1342",
            prereqs: and(exam, req("MATH", "1341")),
          },
        ],
      }),
    ],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {
    "1/fall/MATH 1342": missing("MATH", "1341"),
  });
});

test("multi-year ordering includes summer terms and sorts by year", () => {
  const schedule: Audit = {
    // Stored out of order on purpose; year number decides the order
    years: [
      year(2, { fall: [{ ...CS2510, prereqs: req("CS", "2500") }] }),
      year(1, {
        summer1: [
          { subject: "CS", classId: "1800" },
          { subject: "CS", classId: "1802", prereqs: req("CS", "1800") },
        ],
        summer2: [CS2500],
      }),
    ],
  };
  const warnings = getPrereqWarnings(schedule);
  assert.deepEqual(
    warnings.years.map((y) => y.year),
    [1, 2],
  );
  assert.deepEqual(allWarnings(warnings), {
    "1/summer1/CS 1802": missing("CS", "1800"),
  });
});

test("overrides satisfy prereqs and coreqs", () => {
  const schedule: Audit = {
    years: [
      year(1, {
        fall: [
          {
            ...CS2510,
            prereqs: req("CS", "2500"),
            coreqs: req("CS", "2511"),
          },
        ],
      }),
    ],
    overrides: [course(CS2500), course({ subject: "CS", classId: "2511" })],
  };
  assert.deepEqual(allWarnings(getPrereqWarnings(schedule)), {});
  assert.deepEqual(allWarnings(getCoreqWarnings(schedule)), {});
});
