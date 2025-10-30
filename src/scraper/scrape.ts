import { BannerSection, Config, Course, TermScrape } from "./types";
import { decode } from "he";
import { parseCoreqs, parsePrereqs, populatePostReqs, Requisite } from "./reqs";
import { $fetch, processWithConcurrency } from "./utils";
import { parseRooms } from "./rooms";
import { logger } from "@/lib/logger";

// scrapeTerm completely scrapes a term
export async function scrapeTerm(term: string) {
  console.log(`📡 Fetching sections for term ${term}...`);
  const sections = await scrapeSections(term);
  console.log(`✓ Fetched ${sections.length} sections`);

  console.log(`👨‍🏫 Fetching faculty information...`);
  await getSectionFaculty(sections);
  console.log(`✓ Faculty information retrieved`);

  const { courses, subjects: subjectCodes } = arrangeCourses(sections);
  console.log(`✓ Organized into ${courses.length} courses`);

  console.log(`📚 Fetching subject descriptions...`);
  const subjects = await getSubjects(term, subjectCodes);
  console.log(`✓ Fetched ${subjects.length} subjects`);

  console.log(`📝 Fetching course names...`);
  await getCourseNames(courses);
  console.log(`✓ Course names retrieved`);

  console.log(`📄 Fetching course descriptions...`);
  await getCourseDescriptions(courses);
  console.log(`✓ Course descriptions retrieved`);

  console.log(`🔗 Fetching requisites...`);
  await getReqs(courses, subjects);
  console.log(`✓ Requisites processed`);

  console.log(`🏢 Processing room schedules...`);
  const rooms = await parseRooms(courses);
  console.log(`✓ Room schedules processed`);

  const termDef = await getTermInfo(term);

  return {
    term: termDef,
    courses,
    subjects,
    rooms: rooms[0],
    buildingCampuses: rooms[1],
  } as TermScrape;
}

// getTermInfo gets the name for the term being scraped from banner
async function getTermInfo(term: string) {
  const resp = await fetch(
    `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/getTerms?offset=1&max=10&searchTerm=${term}`,
  ).then((resp) => resp.json());

  return resp[0];
}

async function getSubjects(term: string, codes: string[]) {
  const resp = await fetch(
    `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/classSearch/get_subject?term=${term}&offset=1&max=900`,
  ).then((r) => r.json());

  return resp
    .filter((subj: { code: string; description: string }) =>
      codes.includes(subj.code),
    )
    .map((subj: { code: string; description: string }) => ({
      code: subj.code,
      description: decode(subj.description),
    }));
}

async function getReqs(
  courses: Course[],
  subjects: { code: string; description: string }[],
) {
  const batchSize = 50;
  const term = courses[0].term;
  const numBatches = Math.ceil(courses.length / batchSize);

  for (let i = 0; i < numBatches; i++) {
    const offset = batchSize * i;
    const promises = courses.slice(offset, offset + 50).map((c) =>
      fetch(
        "https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getCorequisites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `term=${term}&courseReferenceNumber=${c.sections[0].crn}`,
        },
      ).then((resp) => resp.text()),
    );

    const coreqs = await Promise.allSettled(promises);
    coreqs
      .filter((p) => p.status === "fulfilled")
      .forEach((p, j) => {
        courses[offset + j].coreqs = parseCoreqs(
          decode(decode(p.value)),
          subjects,
        );
      });
  }

  for (let i = 0; i < numBatches; i++) {
    const offset = batchSize * i;
    const promises = courses.slice(offset, offset + 50).map((c) =>
      fetch(
        "https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getSectionPrerequisites",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `term=${term}&courseReferenceNumber=${c.sections[0].crn}`,
        },
      ).then((resp) => resp.text()),
    );

    const prereqs = await Promise.allSettled(promises);
    prereqs
      .filter((p) => p.status === "fulfilled")
      .forEach((p, j) => {
        courses[offset + j].prereqs = parsePrereqs(
          decode(decode(p.value)),
          subjects,
        );
      });
  }

  populatePostReqs(courses);
}

// getCourseNames goes through and scrapes the course names for
// every course
export async function getCourseNames(courses: Course[]) {
  const batchSize = 50;
  const term = courses[0].term;
  const numBatches = Math.ceil(courses.length / batchSize);

  for (let i = 0; i < numBatches; i++) {
    const offset = batchSize * i;
    const promises = courses.slice(offset, offset + 50).map((c) =>
      fetch(
        "https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getSectionCatalogDetails",
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
        courses[offset + j].name =
          decode(decode(p.value))
            .replace(/<[^>]*>/g, "") // Remove HTML tags
            .trim()
            .match(/^Title:(.*)$/m)?.[1]
            .trim() || "Unknown Course Name";
      });
  }

  return courses;
}

// getCourseDescriptions goes through and scrapes the course descriptions for
// every course
export async function getCourseDescriptions(courses: Course[]) {
  const batchSize = 50;
  const term = courses[0].term;
  const numBatches = Math.ceil(courses.length / batchSize);

  for (let i = 0; i < numBatches; i++) {
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
        courses[offset + j].description = decode(decode(p.value))
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
          .trim();
      });
  }

  return courses;
}

// arrangeCourses takes the raw sections scraped from banner and
// pulls out the courses, arranging the sections in those courses,
// pulls out the right fields, etc.
export function arrangeCourses(sections: BannerSection[]) {
  const courses: { [key: string]: Course } = {};
  const subjects: string[] = [];

  for (const s of sections) {
    if (!Object.keys(courses).includes(s.subjectCourse)) {
      courses[s.subjectCourse] = {
        name: "", // note - this will be filled in later when the names are scraped
        term: s.term,
        courseNumber: s.courseNumber,
        subject: s.subject,
        description: "", // note - this will be filled in later when the descriptions are scraped
        maxCredits: s.creditHourHigh ?? s.creditHourLow,
        minCredits: s.creditHourLow,
        // Store raw nupath codes from banner - will be filtered during upload
        nupath: s.sectionAttributes
          .filter((a) => a.code.startsWith("NC"))
          .map((a) => a.code.replace("NC", "")),
        sections: [],
        prereqs: {},
        coreqs: {},
        postreqs: {},
      };
    }

    courses[s.subjectCourse].sections.push({
      crn: s.courseReferenceNumber,
      seatCapacity: s.maximumEnrollment,
      seatRemaining: s.seatsAvailable,
      waitlistCapacity: s.waitCapacity,
      waitlistRemaining: s.waitAvailable,
      classType: s.scheduleTypeDescription,
      honors: s.sectionAttributes.some((a) => a.description === "Honors"),
      // Store raw campus code from banner - will be validated during upload
      campus: s.campusDescription,
      meetingTimes: parseMeetingTimes(s),

      faculty: s.f ?? "TBA",
    });

    if (!subjects.includes(s.subject)) subjects.push(s.subject);
  }

  return { courses: Object.values(courses), subjects };
}

export function parseMeetingTimes(section: BannerSection) {
  const meetings = [];
  for (const meetingFaculty of section.meetingsFaculty) {
    const meetingTime = meetingFaculty?.meetingTime;
    if (!meetingTime) {
      logger.info("no meeting time " + section.courseReferenceNumber);
      continue;
    }

    const days = [];
    if (meetingTime.sunday) days.push(0);
    if (meetingTime.monday) days.push(1);
    if (meetingTime.tuesday) days.push(2);
    if (meetingTime.wednesday) days.push(3);
    if (meetingTime.thursday) days.push(4);
    if (meetingTime.friday) days.push(5);
    if (meetingTime.saturday) days.push(6);

    // Convert time strings to integers without timezone adjustment
    // e.g., "0800" -> 800, "1430" -> 1430
    const startTime = parseInt(meetingTime.beginTime, 10);
    const endTime = parseInt(meetingTime.endTime, 10);

    const isFinal =
      meetingTime.meetingTypeDescription === "Final Exam" ||
      meetingTime.meetingType === "FNEX";

    // Only include finalDate if it's a final exam
    let finalDate = null;
    if (isFinal && meetingTime.startDate) {
      finalDate = meetingTime.startDate;
    }

    meetings.push({
      building: meetingTime.buildingDescription || meetingTime.building || "",
      room: meetingTime.room || "",
      days: days,
      startTime: startTime,
      endTime: endTime,
      final: isFinal,
      finalDate: finalDate,
    });
  }

  return meetings;
}

// getSectionFaculty scrapes the faculty for the sections. Banner does not
// return the faculty on the search page so these have to be gathered from
// seperate requests
export async function getSectionFaculty(sections: BannerSection[]) {
  if (sections.length === 0) {
    return sections;
  }

  const term = sections[0].term;
  const concurrencyLimit = 20;

  // Create a promise for each section with retry logic
  const fetchPromises = sections.map((section) => async () => {
    try {
      const response = await $fetch(
        `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${term}&courseReferenceNumber=${section.courseReferenceNumber}`,
        {},
        {
          maxRetries: 5,
          initialDelay: 2000,
          maxDelay: 10000,
          retryOn: [429, 500, 502, 503, 504, 302],
          onRetry: (_, attempt) => {
            logger.debug(
              `retrying section ${section.courseReferenceNumber}, attempt ${attempt}`,
            );
          },
        },
      );
      const data = await response.json();
      return { section, data, success: true };
    } catch (error) {
      logger.error(
        { courseReferenceNumber: section.courseReferenceNumber, error },
        "failed to fetch faculty for section",
      );
      return { section, data: null, success: false };
    }
  });

  // Process with concurrency limit
  const results = await processWithConcurrency(fetchPromises, concurrencyLimit);

  // Update sections with faculty data
  results.forEach(({ section, data, success }) => {
    if (!success || !data?.fmt?.length || !data.fmt[0]?.faculty?.length) {
      section.f = "TBA";
    } else {
      section.f = decode(decode(data.fmt[0].faculty[0].displayName)) ?? "TBA";
    }
  });

  return sections;
}

// scrapeSections get all the sections in a term. It steps through the pages of search results
// to get all the sections in a term. The cookie pool represents how many cookies to get
// (ie number of concurrent requests to send in a batch)
export async function scrapeSections(term: string, cookiePool = 10) {
  const cookies = await getAuthCookies(term, cookiePool);

  // get just the first section to see how many are in a term
  const resp = await fetch(
    `https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_term=${term}&pageOffset=0&pageMaxSize=1`,
    {
      headers: {
        Cookie: cookies[0],
      },
    },
  ).then((resp) => resp.json());

  // Number of batches we have to do. Each page can return up to 500 sections and
  // we only have `cookiePool` number of cookies
  const numBatches = Math.ceil(Math.ceil(resp.totalCount / 500) / cookiePool);

  const rawSections: BannerSection[] = [];

  for (let i = 0; i < numBatches; i++) {
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

    results
      .filter((p) => p.status === "fulfilled")
      .forEach((p) => {
        rawSections.push(...p.value.data);
      });
  }

  if (rawSections.length !== resp.totalCount) {
    logger.warn(
      `Section count mismatch - expected ${resp.totalCount}, received ${rawSections.length}`,
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
