import { parse } from "node-html-parser";
import { Course as PopulatedCourse } from "./types";
export interface Condition {
  type: "and" | "or";
  items: RequisiteItem[];
}

export interface Course {
  subject: string;
  courseNumber: string;
}

export interface Test {
  name: string;
  score: number;
}

export type RequisiteItem = Condition | Course | Test;
export type Requisite = RequisiteItem | Record<string, never>;

export function parseCoreqs(
  rawHtml: string,
  subjects: { code: string; description: string }[],
): Requisite {
  const root = parse(rawHtml);
  const tbody = root.querySelector("tbody");
  if (!tbody) {
    return {};
  }

  const items: RequisiteItem[] = [];
  const tableRows = tbody.querySelectorAll("tr");

  tableRows.forEach((tr) => {
    const data = tr.querySelectorAll("td");
    if (data.length === 3) {
      const newCourse: Course = {
        subject: getSubjectCode(data[0].innerText, subjects),
        courseNumber: data[1].innerText,
      };
      items.push(newCourse);
    } else {
      const newCourse: Course = {
        subject: getSubjectCode(data[1].innerText, subjects),
        courseNumber: data[2].innerText,
      };
      items.push(newCourse);
    }
  });

  // Return single item or wrap in condition
  if (items.length === 0) {
    return {};
  } else if (items.length === 1) {
    return items[0];
  } else {
    return { type: "and", items };
  }
}

export function parsePrereqs(
  rawHtml: string,
  subjects: { code: string; description: string }[],
): Requisite {
  const root = parse(rawHtml);
  const tbody = root.querySelector("tbody");
  if (!tbody) {
    return {};
  }

  // Use a stack to track nested conditions
  const stack: Condition[] = [];
  let currentCondition: Condition = { type: "or", items: [] };
  stack.push(currentCondition);

  const tableRows = tbody.querySelectorAll("tr");
  tableRows.forEach((tr) => {
    const data = tr.querySelectorAll("td");

    // If the And/Or column has a value, update the current condition type
    if (notEmpty(data[0].innerText)) {
      currentCondition.type = data[0].innerText.trim().toLowerCase() as
        | "and"
        | "or";
    }

    // Handle opening parenthesis - create new nested condition
    if (notEmpty(data[1].innerText)) {
      const newCondition: Condition = { type: "or", items: [] };
      currentCondition.items.push(newCondition);
      stack.push(newCondition);
      currentCondition = newCondition;
    }

    // Handle test information
    if (notEmpty(data[2].innerText) && notEmpty(data[3].innerText)) {
      const newTest: Test = {
        name: data[2].innerText,
        score: Number(data[3].innerText),
      };
      currentCondition.items.push(newTest);
    }

    // Handle course information
    if (notEmpty(data[4].innerText) && notEmpty(data[5].innerText)) {
      const newCourse: Course = {
        subject: getSubjectCode(data[4].innerText, subjects),
        courseNumber: data[5].innerText,
      };
      currentCondition.items.push(newCourse);
    }

    // Handle closing parenthesis - pop from stack
    if (notEmpty(data[8].innerText)) {
      stack.pop();
      if (stack.length > 0) {
        currentCondition = stack[stack.length - 1];
      }
    }
  });

  // Get the root condition
  const rootCondition = stack[0];

  // Merge same condition types on adjacent layers
  mergeSameConditionTypes(rootCondition);

  // Return final result
  if (rootCondition.items.length === 0) {
    return {};
  } else if (rootCondition.items.length === 1) {
    return rootCondition.items[0];
  } else {
    return rootCondition;
  }
}
export function populatePostReqs(courses: PopulatedCourse[]) {
  const postreqMap = new Map<string, Set<string>>();

  for (const c of courses) {
    const courseKey = `${c.subject} ${c.courseNumber}`;
    const leafKeys = getAllPrereqs(c.prereqs);
    for (const prereqKey of leafKeys) {
      addPostreqToCourse(prereqKey, courseKey, postreqMap);
    }
  }

  for (const c of courses) {
    const key = `${c.subject} ${c.courseNumber}`;
    const reqs = postreqMap.get(key);
    if (!reqs || reqs.size === 0) {
      c.postreqs = {};
    } else {
      c.postreqs = {
        type: "and",
        items: Array.from(reqs).map((key) => {
          const [subject, courseNumber] = key.split(" ");
          return { subject, courseNumber };
        }),
      };
    }
  }
}

function getAllPrereqs(req: Requisite): string[] {
  const allPrereqs = new Set<string>();
  const visit = (req: Requisite) => {
    if (!req) {
      return;
    }
    if (isCourse(req)) {
      allPrereqs.add(`${req.subject} ${req.courseNumber}`);
    }
    if (isCondition(req)) {
      req.items.forEach((item) => visit(item));
    }
    if (isTest(req)) {
      // TODO: What should I do for a test req
      console.log("TEST REQ", req);
    }
  };
  visit(req);
  return Array.from(allPrereqs);
}

function addPostreqToCourse(
  prereqKey: string,
  courseKey: string,
  postreqMap: Map<string, Set<string>>,
) {
  if (!postreqMap.has(prereqKey)) {
    postreqMap.set(prereqKey, new Set());
  }
  postreqMap.get(prereqKey)!.add(courseKey);
}

function mergeSameConditionTypes(condition: Condition): void {
  // First, recursively merge all nested conditions
  condition.items = condition.items.map((item) => {
    if (isCondition(item)) {
      mergeSameConditionTypes(item);
    }
    return item;
  });

  // Collect items to merge
  const itemsToKeep: RequisiteItem[] = [];
  const itemsToMerge: RequisiteItem[] = [];

  condition.items.forEach((item) => {
    if (isCondition(item) && item.type === condition.type) {
      // If child condition has same type, merge its items up
      itemsToMerge.push(...item.items);
    } else {
      itemsToKeep.push(item);
    }
  });

  // Update the condition's items
  condition.items = [...itemsToKeep, ...itemsToMerge];
}

function isCondition(obj: Requisite | null): obj is Condition {
  return obj !== null && "type" in obj && "items" in obj;
}

function isCourse(obj: Requisite | null): obj is Course {
  return obj !== null && "subject" in obj && "courseNumber" in obj;
}

function isTest(obj: Requisite | null): obj is Course {
  return obj !== null && "name" in obj && "score" in obj;
}

function notEmpty(val: string): boolean {
  return val.trim() !== "";
}

function getSubjectCode(
  name: string,
  subjects: { code: string; description: string }[],
) {
  return subjects.find((s) => s.description === name)?.code ?? "??";
}
