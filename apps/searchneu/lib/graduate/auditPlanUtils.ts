import {
  Audit,
  AuditCourse,
  AuditYear,
  SeasonEnum,
  StatusEnum,
  Template,
} from "./types";

export function createScheduleFromTemplate(template: Template): Audit<null> {
  const schedule = createEmptySchedule();

  try {
    // Check if we have the template data
    if (!template.templateData || !template.name) {
      console.error("Missing template data or name");
      return schedule;
    }

    // Get the plan data from the template
    const planData = template.templateData[template.name];
    if (!planData) {
      console.error("No plan data found in template");
      return schedule;
    }

    // Process each year in the template
    Object.keys(planData).forEach((yearKey) => {
      // Extract the year number from the year key (e.g., "Year 1" -> 1)
      const yearMatch = yearKey.match(/Year (\d+)/i);
      if (!yearMatch) return;

      const yearNum = parseInt(yearMatch[1], 10);
      if (isNaN(yearNum) || yearNum < 1 || yearNum > schedule.years.length)
        return;

      // Get the year object from the schedule (0-indexed)
      const yearObj = schedule.years[yearNum - 1];

      // Set all terms to inactive by default
      yearObj.fall.status = StatusEnum.INACTIVE;
      yearObj.spring.status = StatusEnum.INACTIVE;
      yearObj.summer1.status = StatusEnum.INACTIVE;
      yearObj.summer2.status = StatusEnum.INACTIVE;

      const yearData = planData[yearKey];

      // Process each term in the year
      Object.keys(yearData).forEach((termKey) => {
        const courses = yearData[termKey];
        if (!Array.isArray(courses)) return;

        // Map the term key to the schedule term
        let termObj: {
          status: StatusEnum;
          classes: AuditCourse<null>[];
        };

        switch (termKey.toLowerCase()) {
          case "fall":
            termObj = yearObj.fall;
            break;
          case "spring":
            termObj = yearObj.spring;
            break;
          case "summer 1":
            termObj = yearObj.summer1;
            break;
          case "summer 2":
            termObj = yearObj.summer2;
            break;
          default:
            return; // Skip unknown terms
        }

        // If there are courses, set status to CLASSES
        if (courses.length > 0) {
          termObj.status = StatusEnum.CLASSES;
          termObj.classes = []; // Clear any existing classes

          // Process each course
          courses.forEach((courseStr) => {
            // Parse course string format
            const courseParts = courseStr.match(/([A-Z]+)\s+(\d+[A-Z]*)(.*)/);
            if (!courseParts) {
              console.warn("Couldn't parse course:", courseStr);
              return;
            }

            const subject = courseParts[1];
            const classId = courseParts[2];

            // Create a course object
            const course: AuditCourse<null> = {
              name: courseStr,
              subject,
              classId,
              numCreditsMin: 4, // Default credits
              numCreditsMax: 4,
              id: null,
            };

            // Log the final course object for validation
            console.log(
              `Added course: ${course.subject} ${course.classId}, credits: ${course.numCreditsMin}-${course.numCreditsMax} to year ${yearNum}`,
            );

            // Add course to the term
            termObj.classes.push(course);
          });
        }
      });
    });

    console.log("Final schedule:", schedule);
    return schedule;
  } catch (error) {
    console.error("Error creating schedule from template:", error);
    return createEmptySchedule();
  }
}

//helper function - create empty schedule with 4 academic years and no classes
export function createEmptySchedule(): Audit<null> {
  const years: AuditYear<null>[] = [];

  for (let year = 1; year <= 4; year++) {
    years.push(createEmptyYear(year));
  }

  return {
    years,
  };
}

//helper function - create empty year w terms initialized
export function createEmptyYear(year: number): AuditYear<null> {
  return {
    year,
    fall: {
      season: SeasonEnum.FL,
      status: StatusEnum.CLASSES,
      classes: [],
      id: null,
    },
    spring: {
      season: SeasonEnum.SP,
      status: StatusEnum.CLASSES,
      classes: [],
      id: null,
    },
    summer1: {
      season: SeasonEnum.S1,
      status: StatusEnum.INACTIVE,
      classes: [],
      id: null,
    },
    summer2: {
      season: SeasonEnum.S2,
      status: StatusEnum.INACTIVE,
      classes: [],
      id: null,
    },
    isSummerFull: false,
  };
}

export function generateDefaultPlanTitle() {
  const now = new Date();
  return `Plan ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
}
