import pdf from "pdf-parse";
import { ParsedCourse } from "./types";

// Reads the pdf and returns it as a string to be parsed for courses
export async function parsePdfCourses(
  fileBuffer: Buffer,
): Promise<ParsedCourse[]> {
  try {
    const parser = await pdf(fileBuffer);

    return parseCourses(parser.text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    throw new Error(`Failed to parse PDF: ${message}`);
  }
}

// Parses through the text and extracts unique course subjects and class IDs
function parseCourses(pdfText: string): ParsedCourse[] {
  const courseRegex = /([A-Z]{2,4})\s*(\d{4}[A-Z]*)/g;
  const courses: ParsedCourse[] = [];
  const seenCourses = new Set<string>();

  let match;
  while ((match = courseRegex.exec(pdfText)) !== null) {
    const subject = match[1];
    const classId = match[2];
    const courseKey = `${subject}${classId}`;

    if (!seenCourses.has(courseKey)) {
      seenCourses.add(courseKey);
      courses.push({ subject, classId });
    }
  }

  return courses;
}
