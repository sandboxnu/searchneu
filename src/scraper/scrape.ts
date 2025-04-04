// TODO: url decode like all the strings lol

// scrapeTerm completely scrapes a term
export async function scrapeTerm(term: string) {
  const sections = await scrapeSections(term);
  await getSectionFaculty(sections);

  const { courses, subjects } = arrangeCourses(sections);
  await getCourseDescriptions(courses);

  const termDef = await getTermInfo(term);

  return { term: termDef, courses, subjects };
}

// getTermInfo gets the name for the term being scraped from banner
async function getTermInfo(term: string) {
  console.log("getting term info");
  const resp = await fetch(
    `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=1&max=10&searchTerm=${term}`,
  ).then((resp) => resp.json());

  return resp[0];
}

// getCourseDescriptions goes through and scrapes the course descriptions for
// every course
async function getCourseDescriptions(courses: any[]) {
  console.log("getting course descriptions");
  const batchSize = 50;
  const term = courses[0].term;
  const numBatches = Math.ceil(courses.length / batchSize);
  console.log(`running ${numBatches} batches`);

  for (let i = 0; i < numBatches; i++) {
    console.log(`batch ${i}`);

    const offset = batchSize * i;
    const promises = courses.slice(offset, offset + 50).map((c) =>
      fetch(
        "https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getCourseDescription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `term=${term}&courseReferenceNumber=${c.sections[0].crn}`,
        },
      ).then((resp) => resp.text()),
    );

    const results = await Promise.allSettled(promises);

    results
      .filter((p) => p.status === "fulfilled")
      .forEach((p, j) => {
        // TODO: parse out the section description
        courses[offset + j].description = p.value;
      });
  }

  return courses;
}

// arrangeCourses takes the raw sections scraped from banner and
// pulls out the courses, arranging the sections in those courses,
// pulls out the right fields, etc.
function arrangeCourses(sections: any[]) {
  const courses = {};
  const subjects: string[] = [];

  for (const s of sections) {
    if (!Object.keys(courses).includes(s.subjectCourse)) {
      courses[s.subjectCourse] = {
        name: s.courseTitle,
        term: s.term,
        courseNumber: s.courseNumber,
        subject: s.subject,
        sections: [],
      };
    }

    courses[s.subjectCourse].sections.push({
      crn: s.courseReferenceNumber,
      faculty: s.f,
    });

    if (!subjects.includes(s.subject)) subjects.push(s.subject);
  }

  return { courses: Object.values(courses), subjects };
}

// getSectionFaculty scrapes the faculty for the sections. Banner does not
// return the faculty on the search page so these have to be gathered from
// seperate requests
async function getSectionFaculty(sections: any[]) {
  console.log("getting section faculty");
  const batchSize = 50;
  const term = sections[0].term;
  const numBatches = Math.ceil(sections.length / batchSize);
  console.log(`running ${numBatches} batches`);

  for (let i = 0; i < numBatches; i++) {
    console.log(`batch ${i}`);

    const offset = batchSize * i;
    const promises = sections
      .slice(offset, offset + 50)
      .map((s) =>
        fetch(
          `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${term}&courseReferenceNumber=${s.courseReferenceNumber}`,
        ).then((resp) => resp.json()),
      );

    const results = await Promise.allSettled(promises);

    results
      .filter((p) => p.status === "fulfilled")
      .forEach((p, j) => {
        // TODO: support multiple faculty
        const faculty = p.value.fmt[0].faculty;
        if (faculty.length > 0) {
          sections[offset + j].f = faculty[0].displayName ?? "TBA";
        } else {
          sections[offset + j].f = "TBA";
        }
      });
  }

  return sections;
}

// scrapeSections get all the sections in a term. It steps through the pages of search results
// to get all the sections in a term
async function scrapeSections(term: string) {
  const cookiePool = 10; // The number of cookies to get
  const cookies = await getAuthCookies(term, cookiePool);
  console.log("have cookies");

  // get just the first section to see how many are in a term
  const resp = await fetch(
    `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_term=${term}&pageOffset=0&pageMaxSize=1`,
    {
      headers: {
        Cookie: cookies[0],
      },
    },
  ).then((resp) => resp.json());
  console.log(`need to scrape ${resp.totalCount} sections`);

  // Number of batches we have to do. Each page can return up to 500 sections and
  // we only have `cookiePool` number of cookies
  const numBatches = Math.ceil(Math.ceil(resp.totalCount / 500) / cookiePool);
  console.log(`running ${numBatches} batches`);

  const rawSections = [];

  for (let i = 0; i < numBatches; i++) {
    console.log(`batch ${i}`);
    const promises = Array.from([...Array(cookiePool).keys()], (j) =>
      fetch(
        `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_term=${term}&pageOffset=${(i * cookiePool + j) * 500}&pageMaxSize=500`,
        {
          headers: {
            Cookie: cookies[j],
          },
        },
      ).then((resp) => resp.json()),
    );

    const results = await Promise.allSettled(promises);
    console.log(`batch ${i} responses received`);

    results
      .filter((p) => p.status === "fulfilled")
      .forEach((p) => {
        rawSections.push(...p.value.data);
      });
    console.log(`batch ${i} scraped`);
  }

  if (rawSections.length !== resp.totalCount) {
    console.log(
      `difference in scraped sections - expected ${resp.totalCount} received ${rawSections.length}`,
    );
  }

  return rawSections;
}

// getAuthCookies get a bunch of cookies from the banner api. A cookie is required
// to access the search pages - by getting a bunch, we can fire a bunch
// of concurrent requests
async function getAuthCookies(term: string, count: number) {
  const promises = Array.from({ length: count }, () =>
    fetch("https://nubanner.neu.edu/StudentRegistrationSsb/ssb/term/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UT",
      },
      body: `term=${term}&studyPath=&studyPathText=&startDatepicker=&endDatepicker=`,
    }),
  );

  const results = await Promise.allSettled<Promise<Response>>(promises);

  const cookies = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => {
      const setCookies = result.value.headers.getSetCookie();
      const cookiePairs = setCookies.map((cookie) => {
        return cookie.split(";")[0].trim();
      });

      return cookiePairs.join("; ");
    });

  return cookies;
}
