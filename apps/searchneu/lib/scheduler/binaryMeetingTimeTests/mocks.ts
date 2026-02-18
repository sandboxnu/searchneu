import { SectionWithCourse } from "../filters";

/**
 * Build a mock SectionWithCourse with customizable meeting times.
 * Use this to create consistent test inputs for conflict scenariors.
 */
export function createMockSection(
  id: number,
  meetingTimes: Array<{ days: number[]; startTime: number; endTime: number }>,
  overrides: Partial<SectionWithCourse> = {},
): SectionWithCourse {
  const section: SectionWithCourse = {
    id,
    crn: `CRN${id}`,
    faculty: "Test Faculty",
    campus: "Boston",
    honors: false,
    classType: "Lecture",
    seatRemaining: 10,
    seatCapacity: 30,
    waitlistCapacity: 0,
    waitlistRemaining: 0,
    courseName: "Test Course",
    courseSubject: "TEST",
    courseNumber: "1000",
    meetingTimes: meetingTimes.map((meetingTime) => ({
      ...meetingTime,
      final: false,
      finalDate: undefined,
    })),
    ...overrides,
  };

  return section;
}
