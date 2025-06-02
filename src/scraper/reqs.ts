import { parse } from 'node-html-parser';

// INSTRUCTIONS - fill out the functions. its not thaaaat hard...
//
// some notes for your help:
// - there already is an html parser in the project! link -> https://www.npmjs.com/package/node-html-parser
// - inspiration from how og search did it -> https://github.com/sandboxnu/course-catalog-api/blob/master/scrapers/classes/parsersxe/prereqParser.ts

// a quick pass of types - PLS PLS PLS change if you have a better idea!!!
interface Condition {
  type: "and" | "or";
  next: (Condition | Course)[];
  prev: Condition | null;
}

interface Course {
  subject: string;
  courseNumber: string;
}

type Requisite = Condition | Course | null;

// PERF: remove the below line when the variable is used!!!
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parseCoreqs(rawHtml: string): Requisite {
  // the input (`rawHtml`) will be formatted like the following examples
  // PLEASE NOTE - this endpoint is super stupid in that sometimes the table has
  // 3 columns and sometimes it has 5. the parser has to work with both.
  //
  // EXAMPLE 1 - no coreqs
  // <section aria-labelledby="coReqs">
  //  <h3>Corequisites</h3>
  //  No corequisite course information available.
  // </section>
  //
  // EXAMPLE 2 - 5 column coreq (additional coreqs are additional rows, all ANDed together)
  // <section aria-labelledby="coReqs">
  //    <h3>Corequisites</h3>
  //    <table>
  //      <thead>
  //        <tr>
  //          <th>CRN</th>
  //          <th>Subject</th>
  //          <th>Course Number</th>
  //          <th>Title</th>
  //          <th>Section</th>
  //        </tr>
  //      </thead>
  //      <tbody>
  //        <tr>
  //          <td>20627</td>
  //          <td>Electrical Engineer Tech - CPS</td>
  //          <td>3101</td>
  //          <td>Lab for EET 3100</td>
  //          <td>01</td>
  //        </tr>
  //      </tbody>
  //    </table>
  // </section>
  //
  // EXAMPLE 3 - 3 column coreq (additional coreqs are additional rows, all ANDed together)
  // <section aria-labelledby="coReqs">
  //  <h3>Corequisites</h3>
  //    <table class="basePreqTable">
  //      <thead>
  //        <tr>
  //          <th>Subject</th>
  //          <th>Course Number</th>
  //          <th>Title</th>
  //        </tr>
  //      </thead>
  //      <tbody>
  //        <tr>
  //          <td>Earth &amp; Environmental Sciences</td>
  //          <td>3301</td>
  //          <td>Lab for ENVR 3300</td>
  //        </tr>
  //      </tbody>
  //    </table>
  // </section>

  return null;
}

export function parsePrereqs(rawHtml: string): Requisite {
  const root = parse(rawHtml);
  const tbody = root.querySelector('tbody');

  if (!tbody) {
    // If there is no table body, then there are no prereqs.
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

  // Get final result
  let prereqs: Requisite = curCondition;
  if (curCondition.next.length == 1) {
    prereqs = curCondition.next[0];
  }

  return prereqs;
}

function notEmpty(val: string) {
  return val.trim() !== '';
}

const htmlThree = `<section aria-labelledby="preReqs">
   <h3>Catalog Prerequisites</h3>
   No information
   </section>`

const htmlTwo = `<section aria-labelledby="preReqs">
   <h3>Catalog Prerequisites</h3>
   <table class="basePreqTable">
     <thead>
       <tr>
         <th>And/Or</th>
         <th></th>  <----- this is for opening ( in prereq groups
         <th>Test</th>
         <th>Score</th>
         <th>Subject</th>
         <th>Course Number</th>
         <th>Level</th>
         <th>Grade</th>
         <th></th>  <----- this is for closing ( in prereq groups
       </tr>
     </thead>
     <tbody>
       <tr>
         <td></td>
         <td></td>
         <td></td>
         <td></td>
         <td>Architecture</td>
         <td>2260</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td></td>
       </tr>
       </tbody>
   </table>
  </section>`

const html = `<section aria-labelledby="preReqs">
   <h3>Catalog Prerequisites</h3>
   <table class="basePreqTable">
     <thead>
       <tr>
         <th>And/Or</th>
         <th></th>  <----- this is for opening ( in prereq groups
         <th>Test</th>
         <th>Score</th>
         <th>Subject</th>
         <th>Course Number</th>
         <th>Level</th>
         <th>Grade</th>
         <th></th>  <----- this is for closing ( in prereq groups
       </tr>
     </thead>
     <tbody>
       <tr>
         <td></td>
         <td></td>
         <td></td>
         <td></td>
         <td>Architecture</td>
         <td>2260</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td></td>
       </tr>
       <tr>
         <td>Or</td>
         <td></td>
         <td></td>
         <td></td>
         <td>Art - Media Arts</td>
         <td>2000</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td></td>
       </tr>
       <tr>
         <td>Or</td>
         <td></td>
         <td></td>
         <td></td>
         <td>Art - Fundamentals</td>
         <td>1124</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td></td>
       </tr>
       <tr>
         <td>Or</td>
         <td>(</td>
         <td></td>
         <td></td>
         <td>Art - Fundamentals</td>
         <td>1230</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td></td>
       </tr>
       <tr>
         <td>And</td>
         <td></td>
         <td></td>
         <td></td>
         <td>Art - Fundamentals</td>
         <td>1231</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td>)</td>
       </tr>
       <tr>
         <td>Or</td>
         <td></td>
         <td></td>
         <td></td>
         <td>Art - Design</td>
         <td>2260</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td></td>
       </tr>
       <tr>
         <td>Or</td>
         <td>(</td>
         <td></td>
         <td></td>
         <td>Art - Design</td>
         <td>2262</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td></td>
       </tr>
       <tr>
         <td>And</td>
         <td></td>
         <td></td>
         <td></td>
         <td>Art - Design</td>
         <td>2263</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td>)</td>
       </tr>
       <tr>
         <td>Or</td>
         <td></td>
         <td></td>
         <td></td>
         <td>Computer Science</td>
         <td>2510</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td></td>
       </tr>
       <tr>
         <td>Or</td>
         <td></td>
         <td></td>
         <td></td>
         <td>General Engineering</td>
         <td>1502</td>
         <td>Undergraduate</td>
         <td>D-</td>
         <td></td>
       </tr>
     </tbody>
   </table>
  </section>`

console.log(parsePrereqs(htmlThree));