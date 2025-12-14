const baseUrl = "https://nubanner.neu.edu";

export const sectionSearchEndpoint = (
  term: string,
  offset: number,
  maxSize: number,
) =>
  `${baseUrl}/StudentRegistrationSsb/ssb/searchResults/searchResults?txt_term=${term}&pageOffset=${offset}&pageMaxSize=${maxSize}` as const;

export const sectionFacultyEndpoint = (term: string, crn: string) =>
  `${baseUrl}/StudentRegistrationSsb/ssb/searchResults/getFacultyMeetingTimes?term=${term}&courseReferenceNumber=${crn}` as const;

export const sectionCatalogDetailsEndpoint = (term: string, crn: string) =>
  [
    `${baseUrl}/StudentRegistrationSsb/ssb/searchResults/getSectionCatalogDetails`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `term=${term}&courseReferenceNumber=${crn}`,
    },
  ] as const;

export const courseDescriptionEndpoint = (term: string, crn: string) =>
  [
    `${baseUrl}/StudentRegistrationSsb/ssb/searchResults/getCourseDescription`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `term=${term}&courseReferenceNumber=${crn}`,
    },
  ] as const;

export const sectionPrereqsEndpoint = (term: string, crn: string) =>
  [
    `${baseUrl}/StudentRegistrationSsb/ssb/searchResults/getSectionPrerequisites`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `term=${term}&courseReferenceNumber=${crn}`,
    },
  ] as const;

export const sectionCoreqsEndpoint = (term: string, crn: string) =>
  [
    `${baseUrl}/StudentRegistrationSsb/ssb/searchResults/getCorequisites`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `term=${term}&courseReferenceNumber=${crn}`,
    },
  ] as const;

export const subjectsEndpoint = (term: string) =>
  `${baseUrl}/StudentRegistrationSsb/ssb/classSearch/get_subject?term=${term}&offset=1&max=900` as const;
