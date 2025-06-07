import { parse } from 'node-html-parser';

interface Condition {
  type: "and" | "or";
  next: (Condition | Course | Test)[];
  prev: Condition | null;
}

interface Course {
  subject: string;
  courseNumber: string;
}

interface Test {
  name: string;
  score: number;
}

export type Requisite = Condition | Course | Test | null;

export function parseCoreqs(rawHtml: string): Requisite {
  const root = parse(rawHtml);
  const tbody = root.querySelector('tbody');

  if (!tbody) {
    return null;
  }

  const curCondition: Condition = { type: "and", next: [], prev: null };
  const tableRows = tbody.querySelectorAll('tr');
  tableRows.forEach((tr) => {
    const data = tr.querySelectorAll('td');

    if (data.length === 3) {
      const newCourse: Course = { subject: data[0].innerText, courseNumber: data[1].innerText }
      curCondition.next.push(newCourse);
    } else {
      const newCourse: Course = { subject: data[1].innerText, courseNumber: data[2].innerText }
      curCondition.next.push(newCourse);
    }
  })

  let coreqs: Requisite = curCondition;
  if (curCondition.next.length == 1) {
    coreqs = curCondition.next[0];
  }

  return coreqs;
}

export function parsePrereqs(rawHtml: string): Requisite {
  const root = parse(rawHtml);
  const tbody = root.querySelector('tbody');

  if (!tbody) {
    return null;
  }
   
  // Start with default condition
  let curCondition: Condition = { type: "or", next: [], prev: null };
  const tableRows = tbody.querySelectorAll('tr');
  tableRows.forEach((tr) => {
    const data = tr.querySelectorAll('td');
    
    // If the And/Or column has a value, update the current condition type accordingly
    if (notEmpty(data[0].innerText)) {
      curCondition.type = data[0].innerText.toLowerCase() as "and" | "or";
    }

    // Handle (
    if (notEmpty(data[1].innerText)) {
      const newCondition: Condition = { type: "or", next: [], prev: curCondition };
      curCondition.next.push(newCondition);
      curCondition = newCondition;
    }

    // Handle test information
    if (notEmpty(data[2].innerText) && notEmpty(data[3].innerText)) {
      const newTest: Test = { name: data[2].innerText, score: parseInt(data[3].innerText)}
      curCondition.next.push(newTest);
    }

    // Handle course information
    if (notEmpty(data[4].innerText) && notEmpty(data[5].innerText)) {
      const newCourse: Course = { subject: data[4].innerText, courseNumber: data[5].innerText };
      curCondition.next.push(newCourse);
    }
    
    // Handle )
    if (notEmpty(data[8].innerText)) {
      if (curCondition.prev) {
        curCondition = curCondition.prev;
      }
    }
  })
  
  // Make sure we get the top-most condition
  while (curCondition.prev) {
    curCondition = curCondition.prev;
  }

  // Merge same condition types on adjacent layers
  mergeSameConditionTypes(curCondition);

  // Get final result
  let prereqs: Requisite = curCondition;
  if (curCondition.next.length == 1) {
    prereqs = curCondition.next[0];
  }

  return prereqs;
}

function mergeSameConditionTypes(condition: Condition) {
  // First merge everything below
  condition.next.forEach((item) => {
    if (isCondition(item)) {
      mergeSameConditionTypes(item);
    }
  })

  // Do the actual merge
  let itemsToMerge: (Condition | Course | Test)[] = []
  condition.next.forEach((item) => {
    if (isCondition(item) && item.type === condition.type) {
      itemsToMerge = itemsToMerge.concat(item.next);
    }
  })
  itemsToMerge.forEach((item) => {
    if (isCondition(item)) {
      item.prev = condition;
    }
  })
  condition.next = condition.next.concat(itemsToMerge);
  condition.next = condition.next.filter(item => !(isCondition(item) && item.type === condition.type));
}

function isCondition(obj: Condition | Course | Test | null): obj is Condition {
  return obj !== null && 'type' in obj;
}

function notEmpty(val: string) {
  return val.trim() !== '';
}